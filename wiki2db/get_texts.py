#!/usr/bin/env python3
# -*- coding: utf-8 -*-
'''
Stub
'''

import argparse
import codecs
import sys

import re
import unicodedata

HREF_RE = re.compile(r'<a href[^>]*>')


USELESS_CHARS = '\u000D\u0085\u2028\u2029\u0009'  # some line breaks and TAB
DELETE_TABLE = str.maketrans('', '', USELESS_CHARS)

HIRAGANA = re.compile('[\u3041-\u3094]')
FILTER = re.compile(r'[「」『』()（） <>\[\]\-\*\'"#]')


def get_curid(line):
    sep1 = line.find('"') + 1
    sep2 = line.find('"', sep1)
    return line[sep1: sep2]


def operation(inf, outf):
    '''
    Stub
    '''
    link_start = ''
    link_end = ''
    curid = None

    for line in inf:
        if line.startswith('<doc'):
            curid = get_curid(line)
            continue
        elif len(line) < 10:
            continue
        elif line.find("。") < 0:
            continue
        line = line.translate(DELETE_TABLE)

        line = line.replace('</a>', link_end)

        while True:
            prev = line
            line = HREF_RE.sub(link_start, line)
            if prev == line:
                break

        for myline in line.split("。"):
            myline = unicodedata.normalize('NFKC', myline)

            if not HIRAGANA.search(myline):
                continue
            if FILTER.search(myline):
                continue

            myline = myline.strip()
            if 10 <= len(myline) <= 50:
                outf.write(curid)
                outf.write("\t")
                outf.write(myline)
                outf.write("。\n")


def main():
    '''
    Parse arguments
    '''
    oparser = argparse.ArgumentParser()
    oparser.add_argument("-i", "--input", dest="input", default="-")
    oparser.add_argument("-o", "--output", dest="output", default="-")
    opts = oparser.parse_args()

    if opts.input == "-":
        inf = sys.stdin
    else:
        inf = codecs.open(opts.input, "r", "utf8")

    if opts.output == "-":
        outf = sys.stdout
    else:
        outf = codecs.open(opts.output, "w", "utf8")

    operation(inf, outf)


if __name__ == '__main__':
    main()
