/*
186. 反转字符串中的单词 II
给你一个字符数组 s ，反转其中 单词 的顺序。

单词 的定义为：单词是一个由非空格字符组成的序列。s 中的单词将会由单个空格分隔。

必须设计并实现 原地 解法来解决此问题，即不分配额外的空间。

 

示例 1：

输入：s = ["t","h","e"," ","s","k","y"," ","i","s"," ","b","l","u","e"]
输出：["b","l","u","e"," ","i","s"," ","s","k","y"," ","t","h","e"]
示例 2：

输入：s = ["a"]
输出：["a"]

我的思路是用爽指针。
设置两个指针，x和y。
一个指针x先走等遇到空格了。就停下然后把指针
y到x的前一个的字符串翻转。
y到x（空格的后一个字符串上）
x继续向后找空格。如此循环。直到结束。
用while来循环。



*/ 


/**
 * @param {character[]} s
 * @return {void} Do not return anything, modify s in-place instead.
 */
var reverseWords = function(s) {
  let l = 0; // 永远指向“当前单词的起点”
  let r = 0; // 永远指向“正在扫描的位置”，并且 只增不减
  fanzhuan(0,s.length-1,s); // 先整体反转一下
  // 既然 r 单调递增，那循环条件就应该只依赖 r
  while(r<s.length){
    // 如果是空格
    if(s[r] === " "){
      fanzhuan(l,r-1,s)
      l = r+1;
    }
    r = r+1;
  }
  fanzhuan(l,s.length-1,s)
  return s;
};

// 输入：s = ["t","h","e"," ","s","k","y"," ","i","s"," ","b","l","u","e"]
// 输出：["b","l","u","e"," ","i","s"," ","s","k","y"," ","t","h","e"]
var fanzhuan = function(x,y,s){
  let l = x;
  let r = y;
  while(l < r){
    [s[l],s[r]] = [s[r],s[l]];
    l++;
    r--;
  }
}