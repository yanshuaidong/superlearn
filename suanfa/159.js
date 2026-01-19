/*
159. 至多包含两个不同字符的最长子串
给你一个字符串 s ，请你找出 至多 包含 两个不同字符 的最长子串，并返回该子串的长度。

示例 1：

输入：s = "eceba"
输出：3
解释：满足题目要求的子串是 "ece" ，长度为 3 。
示例 2：

输入：s = "ccaabbb"
输出：5
解释：满足题目要求的子串是 "aabbb" ，长度为 5 。



*/

/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstringTwoDistinct = function (s) {
  // 边界
  if (s.length === 0) return 0;
  // count 用来记录窗口每个字符出现的次数
  // key 字符，value 次数
  const count = new Map();

  let left = 0; // 左边界
  // let right = 0; // 右边界
  let res = 0; // 最长合法子串长度
  for (let right = 0; right < s.length; right++) {
    let ch = s[right]; // 右侧字符

    // 1扩张窗口 把 s[right] 这个字符纳入窗口，并更新计数
    count.set(ch, (count.get(ch) || 0) + 1);
    // 2) 如果窗口内不同字符超过 2 种，就收缩左边界
    // 直到窗口重新变成“至多 2 种不同字符”
    while(count.size > 2){
      const leftCh = s[left];

      // 左边界字符即将移出窗口，所以次数 -1
      count.set(leftCh, count.get(leftCh) - 1);
      // 如果字符串次数变成0，说明窗口已经没有她了了，需要删除k。

      if(count.get(leftCh) === 0){
        count.delete(leftCh);
      }
      left++;
    }
        // 3) 走到这里，窗口一定合法（<= 2 种字符）
    //    用当前窗口长度更新答案
    res = Math.max(res, right - left + 1);
  }
  return res;
};

lengthOfLongestSubstringTwoDistinct("eceba",2)