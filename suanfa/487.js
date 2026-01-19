/*

487. 最大连续1的个数 II
给定一个二进制数组 nums ，如果最多可以翻转一个 0 ，则返回数组中连续 1 的最大个数。

 

示例 1：

输入：nums = [1,0,1,1,0]
输出：4
解释：翻转第一个 0 可以得到最长的连续 1。
     当翻转以后，最大连续 1 的个数为 4。
示例 2:

输入：nums = [1,0,1,1,0,1]
输出：4

*/

/**
 * @param {number[]} nums
 * @return {number}
 */
var findMaxConsecutiveOnes = function (nums) {
  let res = 0; // 最大连续 1 的个数
  let left = 0;
  // 核心是维护一个窗口，窗口里最多出现1个0。
  // 窗口对象
  let windowmap = {
    a: 0, // 0
    b: 0, // 1
  }

  // 一堆11里面仅仅只有1个0才能把0变成1 1001111

  // let right = 0;
  // nums = [1,0,1,1,0]
  for (let right = 0; right < nums.length; right++) {
    let ch = nums[right];
    if (ch === 0) {
      windowmap.a = windowmap.a + 1;
    }
    if (ch === 1) {
      windowmap.b = windowmap.b + 1;
    }

    // a:0,b:1   2的时候 
    while (windowmap.a > 1) {
      // left 4 
      // 变成这样 1,1,0
      let leftch = nums[left];
      if (leftch === 0) {
        windowmap.a = windowmap.a - 1;
      }
      if (leftch === 1) {
        windowmap.b = windowmap.b - 1;
      }
      left++;
    }
    // 
    res = Math.max(res, windowmap.b + windowmap.a)
  }
  // 
  return res;
};

const res = findMaxConsecutiveOnes([1]);
console.log(res);
