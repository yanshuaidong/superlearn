/*
369. 给单链表加一

给定一个用链表表示的非负整数， 然后将这个整数 再加上 1 。

这些数字的存储是这样的：最高位有效的数字位于链表的首位 head 。

 

示例 1:

输入: head = [1,2,3]
输出: [1,2,4]
示例 2:

输入: head = [0]
输出: [1]
 

提示：

链表中的节点数在 [1, 100] 的范围内。
0 <= Node.val <= 9
由链表表示的数字不包含前导零，除了零本身。


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
 * @return {ListNode}
 */
var plusOne = function(head) {
    let numStr = '';
    let tempLink = head;
    while(tempLink && tempLink.next){
        numStr+= tempLink.val;
        tempLink = tempLink.next;
    }
    let num = Number(numStr);
    num+=1;
    while(num%10)
};