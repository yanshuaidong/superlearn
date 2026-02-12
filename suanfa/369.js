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
    let cur = head;
    while(cur){
        numStr+= cur.val;
        cur = cur.next;
    }
    let big1 = BigInt(numStr);
    let big2 = big1 + 1n;
    let newNumStr = big2.toString();
    // 头节点
    let newHead = new ListNode(Number(newNumStr[0]), null);
    // 指针
    let tempNode = newHead;
    // 从下标1开始
    for (let i = 1; i < newNumStr.length; i++) {
        // 新建的节点
        let newTempNode = new ListNode(Number(newNumStr[i]),null);
        // 指针的下一个位置是新节点。
        tempNode.next = newTempNode;
        // 指针向下移动
        tempNode = newTempNode;
    }
    return newHead;
};

/*
总结：

let cur = head;
while(cur){
 cur = cur.next;
}

let slow = head;
let fast = head;
while(fast && fast.next){

slow = slow.next;
fast = fast.next.next;
}









*/ 