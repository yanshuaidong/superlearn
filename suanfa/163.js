/*
163. 缺失的区间
简单
相关标签
conpanies icon
相关企业
给你一个闭区间 [lower, upper] 和一个 按从小到大排序 的整数数组 nums ，其中元素的范围在闭区间 [lower, upper] 当中。

如果一个数字 x 在 [lower, upper] 区间内，并且 x 不在 nums 中，则认为 x 缺失。

返回 准确涵盖所有缺失数字 的 最小排序 区间列表。也就是说，nums 的任何元素都不在任何区间内，并且每个缺失的数字都在其中一个区间内。

 
示例 1：

输入: nums = [0, 1, 3, 50, 75], lower = 0 , upper = 99
输出: [[2,2],[4,49],[51,74],[76,99]]
解释：返回的区间是：
[2,2]
[4,49]
[51,74]
[76,99]
示例 2：

输入： nums = [-1], lower = -1, upper = -1
输出： []
解释： 没有缺失的区间，因为没有缺失的数字。

*/

/**
 * @param {number[]} nums
 * @param {number} lower
 * @param {number} upper
 * @return {number[][]}
 */
var findMissingRanges = function (nums, lower, upper) {
    // lower, upper 是闭区间
    // 按从小到大排序 的整数数组 nums
    // 如果一个数字 x 在 [lower, upper] 区间内，并且 x 不在 nums 中，则认为 x 缺失。
    // isqueshi  = x>= lower && x <= upper && nums.has(x)
    // 返回 准确涵盖所有缺失数字 的 最小排序 区间列表。
    // 区间列表最小排序
    //  0 9
    //  如果0 1 2 3 4 。。9 则就是0
    // 缺少1个数字 0 1 3
    if(nums.length === 0){
        return [[lower,upper]];
    }
    let res = [];
    if (nums[0] !== lower) {
        res.push(lower)
    }
    for (let i = 0; i < nums.length; i++) {
        let num = nums[i];
        // 什么时候回有，当前数字和前面不连续了
        // 没有前面数字的时候就是左边
        // 没有后面数字的时候就是右边
        let left = num - 1;
        let right = num + 1;
        let lastnum = nums[i - 1];
        let nextnum = nums[i + 1];


        if (left !== lastnum && left >= lower) {
            res.push(left)
        }
        if (right !== nextnum && right <= upper) {
            res.push(right)
        }
    }
    if (nums[nums.length - 1] !== upper) {
        res.push(upper)
    }
    let resa = [];
    for (let index = 1; index < (res.length); index = index + 2) {
        resa.push([res[index - 1], res[index]])
    }
    return resa;
};

findMissingRanges([0, 1, 3, 50, 75], 0, 99)

