

# wiki2db

These scripts convert bz2 compressed Wikipedia texts created by ``dump.sh`` in [FairyMaCorpus](https://github.com/FairyDevicesRD/FairyMaCorpus) into SQLite database.

```sh
make -j <# of CPU> \
    WIKIP_EXTRACTED=/path/to/extracted \
    NORMALIZER=/path/to/FairyMaCorpus/scripts/wiki2txt/normalize.py \
    MECAB_OPT='-d /path/to/mecabdic' \
    OUT_DIR=/path/to/out
```

