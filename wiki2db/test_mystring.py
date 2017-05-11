#!/usr/bin/env python3
# -*- coding: utf-8 -*-
'''
Test
'''

import unittest

import mystring


class TestSimple(unittest.TestCase):
    '''
    The simplest cases
    '''

    def setUp(self):
        pass

    def test_simple(self):
        '''
        input test
        '''
        input2gold = {
            'インベスター/名詞/普通名詞 に/助詞/格助詞 、/特殊/読点 セアヤベンチャーズ/UNK/ が/助詞/格助詞 なる/動詞/':
            [
                [0, 6, 7, 8, 17, 18, 20],
                ['名詞', '助詞', '特殊', 'UNK', '助詞', '動詞'],
                ['普通名詞', '格助詞', '読点', '', '格助詞', '']
            ]
        }

        for intest, gold in input2gold.items():
            sys_positions, sys_pos0s, sys_pos1s = mystring.get_array(intest)
            self.assertEqual(sys_positions, gold[0])
            self.assertEqual(sys_pos0s, gold[1])
            self.assertEqual(sys_pos1s, gold[2])

if __name__ == '__main__':
    unittest.main()
