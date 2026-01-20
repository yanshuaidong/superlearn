/*
分析。
266. 回文排列
给你一个字符串 s ，如果该字符串的某个排列是 回文串 ，则返回 true ；否则，返回 false 。

 

示例 1：

输入：s = "code"
输出：false
示例 2：

输入：s = "aab"
输出：true
示例 3：

输入：s = "carerac"
输出：true



*/

/**
 * @param {string} s
 * @return {boolean}
 */
var canPermutePalindrome = function (s) {
  // 回文串 的特征
  let slength = s.length;
  let smap = new Map();
  // carerac
  for (let i = 0; i < s.length; i++) {
    let ch = s[i];
    smap.set(ch, (smap.get(ch) || 0) + 1);
  }

  // temp 看smap中 字符串 的数量是奇数的个数
  let temp = 0;
  for (let [key, value] of smap) {
    // 如果是奇数
    if (value % 2) {
      temp++;
    }
  }

  // 奇数
  if (slength % 2) {
    // 数量只有一个技术，其他数量全是偶数才能组成 回文串
    if (temp === 1) {
      return true;
    } else {
      return false;
    }
  }
  // 偶数
  if (!(slength % 2)) {
    // 一定全是偶数 如果某一个字符串出现奇数就一定不能组成回文串
    if (temp === 0) {
      return true;
    } else {
      return false;
    }

  }
};