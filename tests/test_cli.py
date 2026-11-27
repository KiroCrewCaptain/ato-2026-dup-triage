"""Tests for jot. Run with: python -m unittest discover -s tests"""

import io
import json
import os
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

from jot import cli


class JotTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / "notes.json"
        self._old = os.environ.get("JOT_FILE")
        os.environ["JOT_FILE"] = str(self.path)

    def tearDown(self):
        if self._old is None:
            os.environ.pop("JOT_FILE", None)
        else:
            os.environ["JOT_FILE"] = self._old
        self.tmp.cleanup()

    def run_jot(self, *argv):
        out = io.StringIO()
        with redirect_stdout(out):
            code = cli.main(list(argv))
        return code, out.getvalue()


class TestStorage(JotTestCase):
    def test_missing_file_means_no_notes(self):
        self.assertEqual(cli.load_notes(self.path), [])

    def test_round_trip(self):
        notes = []
        cli.add_note(notes, "buy milk", ["home"])
        cli.save_notes(self.path, notes)
        self.assertEqual(cli.load_notes(self.path)[0]["text"], "buy milk")

    def test_jot_file_env_wins(self):
        self.assertEqual(cli.notes_path(), self.path)

    def test_empty_file_means_no_notes(self):
        self.path.write_text("", encoding="utf-8")
        self.assertEqual(cli.load_notes(self.path), [])

    def test_truncated_file_raises_clear_error(self):
        self.path.write_text('[{"id": 1, "text": "unterminated', encoding="utf-8")
        with self.assertRaises(cli.NotesFileError):
            cli.load_notes(self.path)

    def test_main_reports_corrupt_file_without_a_traceback(self):
        self.path.write_text("{", encoding="utf-8")
        err = io.StringIO()
        with redirect_stderr(err):
            code = cli.main(["list"])
        self.assertEqual(code, 1)
        self.assertIn("not valid JSON", err.getvalue())


class TestCommands(JotTestCase):
    def test_add_then_list(self):
        self.run_jot("add", "write slides", "--tag", "work")
        code, out = self.run_jot("list")
        self.assertEqual(code, 0)
        self.assertIn("write slides", out)
        self.assertIn("#work", out)

    def test_done_hides_from_list(self):
        self.run_jot("add", "one")
        self.run_jot("done", "1")
        _, out = self.run_jot("list")
        self.assertNotIn("one", out)
        _, out = self.run_jot("list", "--all")
        self.assertIn("[x]", out)

    def test_tag_filter(self):
        self.run_jot("add", "a", "--tag", "home")
        self.run_jot("add", "b", "--tag", "work")
        _, out = self.run_jot("list", "--tag", "work")
        self.assertIn(" b", out)
        self.assertNotIn(" a ", out)

    def test_search_substring(self):
        self.run_jot("add", "call the dentist")
        _, out = self.run_jot("search", "dentist")
        self.assertIn("dentist", out)

    def test_rm_unknown_id(self):
        code, _ = self.run_jot("rm", "42")
        self.assertEqual(code, 1)

    def test_export_is_json(self):
        self.run_jot("add", "x")
        _, out = self.run_jot("export")
        self.assertEqual(json.loads(out)[0]["text"], "x")


if __name__ == "__main__":
    unittest.main()
