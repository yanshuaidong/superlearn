/*
1055. 形成字符串的最短路径
对于任何字符串，我们可以通过删除其中一些字符（也可能不删除）来构造该字符串的 子序列 。(例如，“ace” 是 “abcde” 的子序列，而 “aec” 不是)。

给定源字符串 source 和目标字符串 target，返回 源字符串 source 中能通过串联形成目标字符串 target 的 子序列 的最小数量 。如果无法通过串联源字符串中的子序列来构造目标字符串，则返回 -1。

 

示例 1：

输入：source = "abc", target = "abcbc"
输出：2
解释：目标字符串 "abcbc" 可以由 "abc" 和 "bc" 形成，它们都是源字符串 "abc" 的子序列。
示例 2：

输入：source = "abc", target = "acdbc"
输出：-1
解释：由于目标字符串中包含字符 "d"，所以无法由源字符串的子序列构建目标字符串。
示例 3：

输入：source = "xyz", target = "xzyxz"
输出：3
解释：目标字符串可以按如下方式构建： "xz" + "y" + "xz"。


*/ 


/**
 * @param {string} source
 * @param {string} target
 * @return {number}
 */
var shortestWay = function(source, target) {
    let num = 0; // 子序列 的最小数量
    // 贪心匹配，一个字符串子序列要尽可能的匹配多个。
    let x = 0; // source 的指针
    let y = 0; // target 的指针
    let s = source;
    let t = target;
    // 只要目标串还有就一直循环。
    while(t.length>0){ // abcbc
      let templ = t.length;
      // 对比的时候任何字符串没了就停止。
      while(x<s.length && y<t.length){ // 0,0,3,5
        // 如果s的左边第字符和右边的一样
        // abc abcbc xyz xzyxz
        if(s[x] === t[y]){
          t = t.slice(y+1);
          // t = bcbc
        }
        x++; // 1
      }
      if(y === 0 && templ === t.length) return -1; //循环了一遍右边一直没有找到左边的一个匹配的。
      x = 0;
      y = 0;
      num+=1; // 二层whie一次就是贪心一次
      // t = bc l = 2 r = 0
    }
    return num;
};