/*
1474. 删除链表 M 个节点之后的 N 个节点
简单
相关标签
conpanies icon
相关企业
提示
给定链表 head 和两个整数 m 和 n. 遍历该链表并按照如下方式删除节点:

开始时以头节点作为当前节点.
保留以当前节点开始的前 m 个节点.
删除接下来的 n 个节点.
重复步骤 2 和 3, 直到到达链表结尾.
在删除了指定结点之后, 返回修改过后的链表的头节点.

 

示例 1:



输入: head = [1,2,3,4,5,6,7,8,9,10,11,12,13], m = 2, n = 3
输出: [1,2,6,7,11,12]
解析: 保留前(m = 2)个结点,  也就是以黑色节点表示的从链表头结点开始的结点(1 ->2).
删除接下来的(n = 3)个结点(3 -> 4 -> 5), 在图中以红色结点表示.
继续相同的操作, 直到链表的末尾.
返回删除结点之后的链表的头结点.
示例 2:



输入: head = [1,2,3,4,5,6,7,8,9,10,11], m = 1, n = 3
输出: [1,5,9]
解析: 返回删除结点之后的链表的头结点.
示例 3:

输入: head = [1,2,3,4,5,6,7,8,9,10,11], m = 3, n = 1
输出: [1,2,3,5,6,7,9,10,11]
示例 4:

输入: head = [9,3,7,7,9,10,8,2], m = 1, n = 2
输出: [9,7,8]
 

提示:

链表中节点数目在范围 [1, 104] 内
1 <= Node.val <= 106
1 <= m, n <= 1000

*/ 

/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @param {number} m
 * @param {number} n
 * @return {ListNode}
 */
var deleteNodes = function(head, m, n) {
    let headLink = head;
    let tempLink = head;
    while(tempLink && tempLink.next){
        // 输入：1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13
        // m = 2, n = 3

        // 第一次 从1开始 从1到2
        // 第二次 从6开始 从6到7
        for (let i = 0; i < m-1; i++) {
            if(tempLink.next){
                tempLink = tempLink.next;
            }
        }
        // 第一次 preLink 是2
        // 第二次 preLink 是7
        let preLink = tempLink;
        // 第一次 走3走到5 （3,4,5要删掉）
        // 第一次 走8走到10 （8,9,10要删掉）
        for (let j = 0; j < n; j++) {
            if(tempLink.next){
                tempLink = tempLink.next;
            }
        }
        
        // 第一次 2连接6
        // 第一次 7连接11
        preLink.next = tempLink.next;
        // 第一次 tempLink到6
        // 第一次 tempLink到11
        tempLink = tempLink.next;
    }
    return headLink;
};