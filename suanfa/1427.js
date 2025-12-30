/*
给定一个包含小写英文字母的字符串 s 以及一个矩阵 shift，其中 shift[i] = [direction, amount]：

direction 可以为 0 （表示左移）或 1 （表示右移）。
amount 表示 s 左右移的位数。
左移 1 位表示移除 s 的第一个字符，并将该字符插入到 s 的结尾。
类似地，右移 1 位表示移除 s 的最后一个字符，并将该字符插入到 s 的开头。
对这个字符串进行所有操作后，返回最终结果。

 

示例 1：

输入：s = "abc", shift = [[0,1],[1,2]]
输出："cab"
解释：
[0,1] 表示左移 1 位。 "abc" -> "bca"
[1,2] 表示右移 2 位。 "bca" -> "cab"
示例 2：

输入：s = "abcdefg", shift = [[1,1],[1,1],[0,2],[1,3]]
输出："efgabcd"
解释： 
[1,1] 表示右移 1 位。 "abcdefg" -> "gabcdef"
[1,1] 表示右移 1 位。 "gabcdef" -> "fgabcde"
[0,2] 表示左移 2 位。 "fgabcde" -> "abcdefg"
[1,3] 表示右移 3 位。 "abcdefg" -> "efgabcd"

*/

/**
 * @param {string} s
 * @param {number[][]} shift
 * @return {string}
 */
var stringShift = function(s, shift) {
  const n = s.length;
  if(n === 0) return s;
  let leftstep = 0;
  let rigthstep = 0;
  for(let i = 0; i< shift.length;i++){
    const [dir,amt] = shift[i];
    if(dir === 0) leftstep += amt;
    else rigthstep += amt;
  }
  // 统一成“向右净位移”
  let net = rigthstep - leftstep;
  net = ((net % n)+n)%n; // 规范到 [0, n-1]
  if(net === 0) return s;
  return s.slice(n - net) + s.slice(0, n-net);
};


stringShift("abc",[[0,1],[1,2]])