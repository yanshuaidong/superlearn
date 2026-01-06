/*
161. 相隔为 1 的编辑距离
中等
相关标签
conpanies icon
相关企业
给定两个字符串 s 和 t ，如果它们的编辑距离为 1 ，则返回 true ，否则返回 false 。

字符串 s 和字符串 t 之间满足编辑距离等于 1 有三种可能的情形：

往 s 中插入 恰好一个 字符得到 t
从 s 中删除 恰好一个 字符得到 t
在 s 中用 一个不同的字符 替换 恰好一个 字符得到 t
 

示例 1：

输入: s = "ab", t = "acb"
输出: true
解释: 可以将 'c' 插入字符串 s 来得到 t。
示例 2:

输入: s = "cab", t = "ad"
输出: false
解释: 无法通过 1 步操作使 s 变为 t。


*/

/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
var isOneEditDistance = function (s, t) {
  let slength = s.length;
  let tlength = t.length;
  let cha = Math.abs(slength - tlength);
  if (cha >= 2) return false; // 3种情况之外的都排除。
  let m = 0; // s 的指针
  let n = 0; // t 的指针
  // 指针不出字符串长度的都向下走
  while (m < slength || n < tlength) {
    // abde
    // abcde
    // 需要插入
    if (slength < tlength) {
      // 找到第一个不等于的
      let a = s[m];
      let b = t[n];
      if (a !== b) {
        let c = s.slice(m);
        let d = t.slice(n + 1);
        if (s.slice(m) === t.slice(n + 1)) {
          return true;
        } else {
          return false;
        }
      }
    }
    // abcde
    // abde
    // 需要删除
    if (slength > tlength) {
      // 找到第一个不等于的
      if (s[m] !== t[n]) {
        if (s.slice(m + 1) === t.slice(n)) {
          return true;
        } else {
          return false;
        }
      }
    }
    // abcde
    // ab2de
    // 需要替换
    if (slength === tlength) {
      // 找到第一个不等于的
      if (s[m] !== t[n]) {
        if (s.slice(m + 1) === t.slice(n+1)) {
          return true;
        } else {
          return false;
        }
      }
    }
    m++;
    n++;
  }
  return false;
};

// let res = isOneEditDistance("ab","abc")

// console.log(res);

let a = 'abcdef'
console.log(a.slice(0,2));


// s和t一定不是随便的字符
// 情况1，说明s一定比t少一个字符。且s中的字符一定和t高度相似。
// 情况2：说明s一定比t多一个字符，且s和t也高度相似。
// 情况3：s和t字符一定是一样的长度。
// 我们可以通过字符长度来确定是那种情况，然后再用双指针来做题。
// 大致思路，先判断s和t的长度。确定有可能是那种情况。不符合最基本的长度关系的都是false。
// 如果是情况1，双指针从s的0和t的0开始，找到第一个不一样的然后将t的不一样的插入到s里面，让s变成一位，然后停止，比较s和t。如果字符串一样就返回true。否则就是false。
// 如果是情况2，双指针从s的0和t的0开始，理论类似。只不过是删除后比较。
// 如果情况3，也是双指针，然后找到第一个不一样的，然后用t里面的替换s里面的。然后就立马对比。
