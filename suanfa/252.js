/*

252. 会议室

给定一个会议时间安排的数组 intervals ，每个会议时间都会包括开始和结束的时间 intervals[i] = [starti, endi] ，请你判断一个人是否能够参加这里面的全部会议。

 

示例 1：

输入：intervals = [[0,30],[5,10],[15,20]]
输出：false
示例 2：

输入：intervals = [[7,10],[2,4]]
输出：true

*/ 


/**
 * @param {number[][]} intervals
 * @return {boolean}
 */
var canAttendMeetings = function(intervals) {
    // 我的想法是先将开始时间排序。
    // 然后比较结束时间，正常情况，前一个会议的结束时间一定比后一个的开始时间小。否则就有问题。
    intervals.sort((a,b)=> a[0] - b[0]); // 按开始时间排序
    for (let i = 1; i < intervals.length; i++) {
      let preEnd = intervals[i-1][1]; // 上一个的结束
      let curStart =  intervals[i][0];  // 当前的开始
      if(curStart < preEnd){
        // 说明交叉了
        return false;
      }
    }
    // 升序(a,b) => a-b;
    // 降序(a,b) => b-a;
    // 什么事情都没有
    return true;
};