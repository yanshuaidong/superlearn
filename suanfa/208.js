// 低-高-低-高
// 偶低-奇高-偶低-奇高


function wigglesort(nums){
  for(let i = 1; i < nums.length; i++){
    const shouldBeup = (i % 2 === 1); // 奇数位置
    // 如果是奇数
    if(shouldBeup){
      if(nums[i-1] >nums[i]){
        // 交换
        let temp = nums[i-1];
        nums[i-1] = nums[i];
        nums[i] = temp;
      }
    }else{
      // 是偶数
      if(nums[i-1] <nums[i]){
        // 交换
        let temp = nums[i-1];
        nums[i-1] = nums[i];
        nums[i] = temp;
      }
    }
  }
  return nums;
}

let nums = [6,6,5,6,3,8]


let res = wigglesort(nums)

console.log(res);
