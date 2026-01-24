/*
1133. 最大唯一数
简单
相关标签
conpanies icon
相关企业
提示
给你一个整数数组 A，请找出并返回在该数组中仅出现一次的最大整数。

如果不存在这个只出现一次的整数，则返回 -1。

 

示例 1：

输入：[5,7,3,9,4,9,8,3,1]
输出：8
解释： 
数组中最大的整数是 9，但它在数组中重复出现了。而第二大的整数是 8，它只出现了一次，所以答案是 8。
示例 2：

输入：[9,9,8,8]
输出：-1
解释： 
数组中不存在仅出现一次的整数。


*/ 

/**
 * @param {number[]} nums
 * @return {number}
 */
var largestUniqueNumber = function(nums) {
  let max = -1;
  let map = new Map();
  for(let i=0;i<nums.length;i++){
    // 输入：[5,7,3,9,4,9,8,3,1]
    //  5 -> 1
    let num = nums[i]; 
    map.set(num, (map.get(num) || 0) +1);
  }
  for(let [key , val] of map){
    // 5 1
    if(val === 1){
      max = Math.max(key,max);
    }
  }
  return max;
};