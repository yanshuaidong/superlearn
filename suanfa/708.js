/*
708. 循环有序列表的插入

给定循环单调非递减列表中的一个点，写一个函数向这个列表中插入一个新元素 insertVal ，使这个列表仍然是循环非降序的。

给定的可以是这个列表中任意一个顶点的指针，并不一定是这个列表中最小元素的指针。

如果有多个满足条件的插入位置，你可以选择任意一个位置插入新的值，插入后整个列表仍然保持有序。

如果列表为空（给定的节点是 null），你需要创建一个循环有序列表并返回这个节点。否则，请返回原先给定的节点。

 

示例 1：


 
输入：head = [3,4,1], insertVal = 2
输出：[3,4,1,2]
解释：在上图中，有一个包含三个元素的循环有序列表，你获得值为 3 的节点的指针，我们需要向表中插入元素 2 。新插入的节点应该在 1 和 3 之间，插入之后，整个列表如上图所示，最后返回节点 3 。


示例 2：

输入：head = [], insertVal = 1
输出：[1]
解释：列表为空（给定的节点是 null），创建一个循环有序列表并返回这个节点。
示例 3：

输入：head = [1], insertVal = 0
输出：[1,0]
 

提示：

0 <= Number of Nodes <= 5 * 104
-106 <= Node.val, insertVal <= 106

*/

/**
 * // Definition for a _Node.
 * function _Node(val, next) {
 *     this.val = val;
 *     this.next = next;
 * };
 */

/**
 * @param {_Node} head
 * @param {number} insertVal
 * @return {_Node}
 */
var insert = function (head, insertVal) {
    // 如果链表为空，直接创建一个新的节点
    if (!head) {
        let newNode = new _Node(insertVal);
        newNode.next = newNode; // 自己指向自己，形成循环
        return newNode;
    }
    let cur = head;
    while (true) {
        const next = cur.next;

        // 情况 A：正常递增段 cur.val <= next.val
        if (cur.val <= next.val) {
            if (insertVal >= cur.val && insertVal <= next.val) {
                cur.next = new _Node(insertVal, next);
                return head;
            }
        }
        // 情况 B：拐点段 cur.val > next.val（最大 -> 最小）
        else {
            // insertVal >= cur.val: 放到最大后面
            // insertVal <= next.val: 放到最小前面
            if (insertVal >= cur.val || insertVal <= next.val) {
                cur.next = new _Node(insertVal, next);
                return head;
            }
        }

        // 走了一整圈都没插入（通常是全相等：比如 [2,2,2]）
        cur = cur.next;
        if (cur === head) {
            break;
        }
    }

    // 情况 C：全相等/没找到合适区间，随便插一个位置即可
    cur.next = new _Node(insertVal, cur.next);
    return head;
};