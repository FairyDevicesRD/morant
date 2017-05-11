#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys


def bigram(text):
    outs = []
    for idx, char in enumerate(text):
        if idx != len(text) - 1:
            outs.append(char + text[idx + 1])
    return " ".join(outs)


def get_array(tokenized):
    positions = []
    pos0s = []
    pos1s = []
    position = 0
    for item in tokenized.split(' '):
        positions.append(position)
        parts = item.split('/')
        surf = parts[0]
        position += len(surf)
        pos0s.append(parts[1])
        pos1s.append(parts[2])
    positions.append(position)
    return positions, pos0s, pos1s
