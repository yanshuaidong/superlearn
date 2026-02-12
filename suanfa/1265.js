/*

1265. 逆序打印不可变链表

给您一个不可变的链表，使用下列接口逆序打印每个节点的值：

ImmutableListNode: 描述不可变链表的接口，链表的头节点已给出。
您需要使用以下函数来访问此链表（您 不能 直接访问 ImmutableListNode）：

ImmutableListNode.printValue()：打印当前节点的值。
ImmutableListNode.getNext()：返回下一个节点。
输入只用来内部初始化链表。您不可以通过修改链表解决问题。也就是说，您只能通过上述 API 来操作链表。

 

示例 1：

输入：head = [1,2,3,4]
输出：[4,3,2,1]
示例 2：

输入：head = [0,-4,-1,3,-5]
输出：[-5,3,-1,-4,0]
示例 3：

输入：head = [-2,0,6,4,4,-6]
输出：[-6,4,4,6,0,-2]
 

提示：

链表的长度在 [1, 1000] 之间。
每个节点的值在 [-1000, 1000] 之间。

*/ 

/**
 * // This is the ImmutableListNode's API interface.
 * // You should not implement it, or speculate about its implementation.
 * function ImmutableListNode() {
 *    @ return {void}
 *    this.printValue = function() { // print the value of this node.
 *       ...
 *    }; 
 *
 *    @return {ImmutableListNode}
 *    this.getNext = function() { // return the next node.
 *       ...
 *    };
 * };
 */

/**
 * @param {ImmutableListNode} head
 * @return {void}
 */
var printLinkedListInReverse = function(head) {
    let cur = head;
    let arr = [];
    while(cur){
        arr.unshift(cur);
        cur = cur.getNext();
    }
    arr.forEach((item)=>{
        item.printValue()
    })
};