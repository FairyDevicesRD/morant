#!/usr/bin/env python3
# -*- coding: utf-8 -*-
'''
Stub
'''

import argparse
import sqlite3
import sys
import json
import codecs


def get_oks(cur, outf):
    '''
    OKとなっているものを出力する．
    (アノテーションがついているものを除く)
    '''
    cur.execute('''select qa.docid, users.id,
    qa.query, qa.match_segment_surf, wikip.text,
    qa.comment, qa.match_segment_pos, wikip.curid
    FROM query_annotations AS qa
             INNER JOIN wikip ON wikip.id = qa.docid,  users ON users.uid = qa.uid
              WHERE type=? AND
              qa.docid NOT IN (SELECT docid FROM ma_annotations)
    GROUP BY qa.docid ''', (1,))
    rows = cur.fetchall()
    for row in rows:
        mseg = row[3]
        scope = mseg.replace("--", "")
        ant = "|" + mseg.replace("--", "|") + "|"
        text = row[4].replace(scope, ant, 1)
        docid = row[0]
        outs = {"id": docid,
                "type": "OK",
                "query": row[2],
                "comment": row[5],
                "match_segment_surf": mseg,
                "match_segment_pos": row[6],
                "curid": row[7]}
        jsd = json.dumps(outs, sort_keys=True, ensure_ascii=False)
        outf.write("%s\t%s\n" % (text, jsd))


def get_ma_annotations(cur, outf):
    '''
    NGまたはOKとなっているアノテーションを出力する
    '''
    cur.execute('''select qa.docid, users.id,
    qa.query, qa.match_segment_surf, ma.annotation,
    qa.comment, qa.type,
    qa.match_segment_pos, wikip.curid
    FROM query_annotations AS qa
             INNER JOIN wikip ON wikip.id = qa.docid
              ,users ON users.uid = qa.uid
              ,ma_annotations AS ma ON wikip.id = ma.docid
    WHERE type IN (1,2)
    GROUP BY qa.docid ''')
    rows = cur.fetchall()
    for row in rows:
        atext = row[4]
        outs = {"id": row[0],
                "query": row[2],
                "comment": row[5],
                "match_segment_surf": row[3],
                "match_segment_pos": row[7],
                "curid": row[8]}
        qatype = row[6]
        if qatype == 1:
            outs["type"] = "OK"
        else:
            outs["type"] = "NG_SEG"

        jsd = json.dumps(outs, sort_keys=True, ensure_ascii=False)
        outf.write("%s\t%s\n" % (atext, jsd))


def operation(wikifname, sysfname, outf):
    '''
    Stub
    '''

    conn = sqlite3.connect(sysfname)
    cur = conn.cursor()
    cur.execute("ATTACH DATABASE ? AS wikip", (wikifname,))
    get_oks(cur, outf)
    get_ma_annotations(cur, outf)


def main():
    '''
    Parse arguments
    '''
    oparser = argparse.ArgumentParser()
    oparser.add_argument("-w", "--wikipedia", dest="wikipedia", required=True)
    oparser.add_argument("-s", "--sys", dest="sys", required=True)
    oparser.add_argument("-o", "--output", dest="output", default="-")
    oparser.add_argument(
        "--verbose", dest="verbose", action="store_true", default=False)
    opts = oparser.parse_args()

    if opts.output == "-":
        outf = sys.stdout
    else:
        outf = codecs.open(opts.output, "w", "utf8")

    operation(opts.wikipedia, opts.sys, outf)


if __name__ == '__main__':
    main()
