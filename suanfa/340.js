/*
340. 至多包含 K 个不同字符的最长子串
给你一个字符串 s 和一个整数 k ，请你找出 至多 包含 k 个 不同 字符的最长子串，并返回该子串的长度。

 

示例 1：

输入：s = "eceba", k = 2
输出：3
解释：满足题目要求的子串是 "ece" ，长度为 3 。
示例 2：

输入：s = "aa", k = 1
输出：2
解释：满足题目要求的子串是 "aa" ，长度为 2 。

*/ 

/**
 * @param {string} s
 * @param {number} k
 * @return {number}
 */
var lengthOfLongestSubstringKDistinct = function(s, k) {
    let res = 0; // 最长子串的长度
    let left = 0;
    let map = new Map();
    // 字符 数量
    // 目标是至多包含k个不同字符的最长子串，并返回该子串长度。
    // 如果是1 fffffff（最多包含1个）
    // 如果是2 wwweeeweewwee 这样的（最多包含2个）
    // 如果是3 sdfffssddfff 这样的（最多包含3个）

    // eceba 2
    for (let right = 0; right < s.length; right++) {
      let ch = s[right]; // 当前的字符 e
      // e -> 2; c -> 1 b -> 1
      map.set(ch, (map.get(ch) || 0 ) + 1)
      // left 0  right 3  eceb
      while(map.size > k){
        let temps = s[left];
        // ec  eb
        // e 2-1 e->1 e->0
        map.set(temps, map.get(temps) - 1);
        if(map.get(temps) === 0){ // 0
          map.delete(temps)
        }
        left++;
      }
      // 
      res = Math.max(res , right - left + 1);
    }
    return res;
};

lengthOfLongestSubstringKDistinct("eceba",2)