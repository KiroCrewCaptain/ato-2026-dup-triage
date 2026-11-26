# jot

A tiny command-line notes tool. One JSON file, no server, no account.

This is the sample project for the workshop. Its issue tracker has realistic
issues, including duplicates, so the workshop app has something real to triage.

## Install

```bash
python3 -m pip install .        # from a clone of this repo
jot --version
```

No install? `python3 -m jot ...` works from the repo root.

## Use

```bash
jot add "write slides" --tag work
jot add "buy milk" --tag home
jot list                 # open notes
jot list --tag work      # only one tag
jot list --all           # include done notes
jot search slides
jot done 1
jot rm 2
jot export               # all notes as JSON
```

Use tags to keep separate lists in one file.

## Where notes live

`~/.jot/notes.json`, or the path in the `JOT_FILE` environment variable.

## Tests

```bash
python3 -m unittest discover -s tests
```

## License

Apache-2.0. See [LICENSE](LICENSE).
