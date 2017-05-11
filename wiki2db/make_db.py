#!/usr/bin/env python3
# -*- coding: utf-8 -*-
'''
Stub
'''

import argparse
import codecs
import sys
import json
import sqlite3

import mystring


def operation(inf, outname):
    '''
    Stub
    '''

    conn = sqlite3.connect(outname)
    cur = conn.cursor()

    query_mktables = ''' CREATE TABLE wikip (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            curid INTER,
            text TEXT,
            positions TEXT,
            pos0s TEXT,
            pos1s TEXT
            );
CREATE VIRTUAL TABLE wikip_cbi_fts USING fts4( words ); 
CREATE VIRTUAL TABLE wikip_mecab_fts USING fts4( words );
BEGIN;
'''

    for line in query_mktables.split(';'):
        cur.execute(line)

    for line in inf:
        items = line[:-1].split("\t")
        curid = items[0]
        text = items[1]
        tokenized = items[2][:-1]
        positions, pos0s, pos1s = mystring.get_array(tokenized)

        cur.execute('''INSERT INTO wikip VALUES(NULL,?,?,?,?,?)''',
                    (curid, text, json.dumps(positions),
                     json.dumps(pos0s, ensure_ascii=False),
                     json.dumps(pos1s, ensure_ascii=False)))

        cur.execute('''INSERT INTO wikip_cbi_fts(words) VALUES(?)''', (mystring.bigram(text),))
        cur.execute('''INSERT INTO wikip_mecab_fts(words) VALUES(?)''', (tokenized,))

    try:
        cur.execute("END")
    except:
        pass
    conn.close()


def main():
    '''
    Parse arguments
    '''
    oparser = argparse.ArgumentParser()
    oparser.add_argument("-i", "--input", dest="input", default="-")
    oparser.add_argument("-o", "--output", dest="output", required=True)
    oparser.add_argument(
        "--verbose", dest="verbose", action="store_true", default=False)
    opts = oparser.parse_args()

    if opts.input == "-":
        inf = sys.stdin
    else:
        inf = codecs.open(opts.input, "r", "utf8")

    operation(inf, opts.output)


if __name__ == '__main__':
    main()
