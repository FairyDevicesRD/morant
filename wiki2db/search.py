#!/usr/bin/env python3
# -*- coding: utf-8 -*-
'''
Stub
'''

import sys
import argparse
import codecs
import sqlite3
import json

import mystring


def get_ma_result(ma_result, start, end):
    '''
    形態素解析結果列にマッチする箇所を返す
    '''
    position = 0
    outs_surf = []
    outs_pos = []
    for token in ma_result.split(" "):
        sep = token.find('/')
        surf = token[:sep]
        position_tail = position + len(surf) - 1

        if(start <= position <= end) or\
            (start <= position_tail <= end) or\
            (position <= start <= position_tail) or\
                (position <= end <= position_tail):
            outs_surf.append(surf)
            outs_pos.append(token)

        position += len(surf)

    return outs_surf, outs_pos


class MySqliteProxy(object):
    '''
    proxy
    '''

    def __init__(self, fname):
        self.conn = sqlite3.connect(fname)
        self.cur = self.conn.cursor()

    def get_by_characters(self, outf, key, limit):
        '''
        与えられた文字列にコーパス内でマッチする箇所を返す
        '''
        limit_query = ''
        if limit is not None:
            limit_query = 'LIMIT %d' % limit

        query = '''SELECT wb.docid, curid, text, wm.words
        FROM (wikip w 
         INNER JOIN wikip_cbi_fts wb ON w.id = wb.docid )
        INNER JOIN wikip_mecab_fts wm ON w.id = wm.docid
        WHERE wb.words MATCH '"%s"'  ''' + limit_query + '''; '''

        myquery = query % mystring.bigram(key)
        result = self.cur.execute(myquery)
        for row in result:
            text = row[2]
            ma_result = row[3]
            index = text.find(key)
            if index < 0:
                continue

            outdic = {}
            outdic['docid'] = row[0]
            outdic['curid'] = row[1]
            outdic['text'] = text
            outdic['ma_result'] = ma_result
            match_surfs, match_poss = get_ma_result(ma_result, index, index + len(key) - 1)
            outdic['match_surfs'] = ' '.join(match_surfs)
            outdic['match_poss'] = ' '.join(match_poss)
            json.dump(outdic, outf, ensure_ascii=False)
            outf.write("\n")

    def __del__(self):
        self.conn.close()


def operation(outf, fname, limit=None):
    '''
    Stub
    '''

    myproxy = MySqliteProxy(fname)
    for line in sys.stdin:
        key = line[:-1]
        myproxy.get_by_characters(outf, key, limit)


def main():
    '''
    Parse arguments
    '''

    oparser = argparse.ArgumentParser()
    oparser.add_argument("-i", "--input", dest="input", required=True)
    oparser.add_argument("-o", "--output", dest="output", default="-")
    oparser.add_argument("-l", "--limit", dest="limit", default=100000, type=int)
    oparser.add_argument(
        "--verbose", dest="verbose", action="store_true", default=False)
    opts = oparser.parse_args()

    if opts.output == "-":
        outf = sys.stdout
    else:
        outf = codecs.open(opts.output, "w", "utf8")
    operation(outf, opts.input, opts.limit)


if __name__ == '__main__':
    main()
