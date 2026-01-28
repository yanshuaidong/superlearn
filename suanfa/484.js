/*
我在做下面的算法题目，请你1，先给我讲一下思路。2然后给我代码。3用例子过一遍代码，例子"DIDI"。请你1，先给我讲一下思路。2然后给我代码。3用例子过一遍代码，例子"DIDI"。请你1，先给我讲一下思路。2然后给我代码。3用例子过一遍代码，例子"DIDI"。
484. 寻找排列
相关标签
栈
贪心
数组
字符串
由范围 [1,n] 内所有整数组成的 n 个整数的排列 perm 可以表示为长度为 n - 1 的字符串 s ，其中:

如果 perm[i] < perm[i + 1] ，那么 s[i] == 'I'
如果 perm[i] > perm[i + 1] ，那么 s[i] == 'D' 。
给定一个字符串 s ，重构字典序上最小的排列 perm 并返回它。

 

示例 1：

输入： s = "I"
输出： [1,2]
解释： [1,2] 是唯一合法的可以生成秘密签名 "I" 的特定串，数字 1 和 2 构成递增关系。
示例 2：

输入： s = "DI"
输出： [2,1,3]
解释： [2,1,3] 和 [3,1,2] 可以生成秘密签名 "DI"，
但是由于我们要找字典序最小的排列，因此你需要输出 [2,1,3]。
*/

/**
 * @param {string} s
 * @return {number[]}
 */
var findPermutation = function (s) {
  // 例子DIDI
  // 1,2,3,4,5
  // n  = 5
  let n = s.length + 1;
  // 当然是循环字符串了
  // 从0 到 3
  let ans = [];
  let stack = [];
  for (let i = 0; i < n; i++) {
    // 数字按顺序入栈：1..n
    stack.push(i+1);
    if( i === s.length || s[i] === 'I'){
      while(stack.length){
        ans.push(stack.pop())
      }
    }
  }
  let a = 1;
  return ans;
};

findPermutation("DIDI")