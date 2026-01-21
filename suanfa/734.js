/*

734. 句子相似性

我们可以将一个句子表示为一个单词数组，例如，句子 "I am happy with leetcode" 可以表示为 arr = ["I","am",happy","with","leetcode"]

给定两个句子 sentence1 和 sentence2 分别表示为一个字符串数组，并给定一个字符串对 similarPairs ，其中 similarPairs[i] = [xi, yi] 表示两个单词 xi and yi 是相似的。

如果 sentence1 和 sentence2 相似则返回 true ，如果不相似则返回 false 。

两个句子是相似的，如果:

它们具有 相同的长度 (即相同的字数)
sentence1[i] 和 sentence2[i] 是相似的
请注意，一个词总是与它自己相似，也请注意，相似关系是不可传递的。例如，如果单词 a 和 b 是相似的，单词 b 和 c 也是相似的，那么 a 和 c  不一定相似 。

 

示例 1:

输入: sentence1 = ["great","acting","skills"], sentence2 = ["fine","drama","talent"], similarPairs = [["great","fine"],["drama","acting"],["skills","talent"]]
输出: true
解释: 这两个句子长度相同，每个单词都相似。
示例 2:

输入: sentence1 = ["great"], sentence2 = ["great"], similarPairs = []
输出: true
解释: 一个单词和它本身相似。
示例 3:

输入: sentence1 = ["great"], sentence2 = ["doubleplus","good"], similarPairs = [["great","doubleplus"]]
输出: false
解释: 因为它们长度不同，所以返回false。

a——b
b——a
b——c
c——b



*/


/**
 * @param {string[]} sentence1
 * @param {string[]} sentence2
 * @param {string[][]} similarPairs
 * @return {boolean}
 */
var areSentencesSimilar = function (sentence1, sentence2, similarPairs) {
  // 1) 长度不同：直接不相似（题目明确要求“相同的字数”）
  if (sentence1.length !== sentence2.length) return false;
  // 2) map ch - set()
  // great ->{fine } fine->{great} drama->{acting} ...
  let map = new Map();

  for (let [leftCh, rightCh] of similarPairs) {
    // 如果 leftCh 还没有对应的 Set，就创建一个
    let leftSet = map.get(leftCh) || new Set();
    // 如果 rightCh 还没有对应的 Set，就创建一个
    let rightSet = map.get(rightCh) || new Set();

    // 建立双向相似关系
    leftSet.add(rightCh);
    rightSet.add(leftCh);
    map.set(leftCh, leftSet);
    map.set(rightCh, rightSet);
  }


  // 遍历每个位置，逐个判断 sentence1[i] 与 sentence2[i] 是否相似
  for (let i = 0; i < sentence1.length; i++) {
    let w1 = sentence1[i];
    let w2 = sentence2[i];


    // 4.1) 单词完全相同：直接相似（题目说明：一个词总是与它自己相似）
    if (w1 === w2) continue;

    // 4.2) 单词不同：必须能在邻接表中找到 w1 与 w2 相似
    // 如果 map 里没有 w1，说明 w1 没有任何相似关系记录 => 不相似
    // 或者虽然有 w1，但它的相似集合里没有 w2 => 不相似
    const set = map.get(w1);
    if (!set || !set.has(w2)) return false;

  }
  return true;
};