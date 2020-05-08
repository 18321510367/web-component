<template>
  <div id="app">
    <div :class="$style.testDiv">
      <tree ref="child-tree" :opts="opts" :load="loadNode" @edvs-tree-handle="edvsTreeHandle"></tree>
    </div>
  </div>
</template>

<script>
import Tree from "./components/tree/tree.vue";

export default {
  data() {
    return {
      opts: {
        data: null,
        //lazy: true, // 懒加载
        check: {
          // 单选或多选
          type: "checkbox", // checkbox或者radio
          checked: "PC", // checkbox选中节点时,P: 选中父节点, C: 选中子节点, PC: 即选中父节点和子节点, null或者''表示不级联选中
          checkRadio: "" // 单选框选中范围, level: 每一级, 否则是整棵树,类型为radio时可用
        },
        buts: [
          { id: "create", name: "新增", icon: "createUpBut el-icon-plus" },
          { id: "remove", name: "删除", icon: "removeBut el-icon-delete" },
          { id: "modify", name: "修改", icon: "updateBut el-icon-edit-outline" }
        ],
        font: {
          style: {
            
          },
          iconStyle: {
            
          }
        }
      }
    };
  },
  beforeMount() {
    this.opts.data = [
      {
        id: "test1",
        name: "张三",
        pId: "",
        disabled: false, // 是否禁用
        checked: false, // 是否默认选中
        icon: "el-icon-folder-opened", // 自定义图片路径或者是文字图标的class
        buts: [
          { id: "create", name: "新增", icon: "createUpBut el-icon-plus" },
          { id: "remove", name: "删除", icon: "removeBut el-icon-delete" },
          { id: "modify", name: "修改", icon: "updateBut el-icon-edit-outline" }
        ]
      },
      {
        id: "22",
        name: "张四",
        pId: "test1",
        disabled: false, // 是否禁用
        checked: false, // 是否默认选中
        icon: "el-icon-folder-opened", // 自定义图片路径或者是文字图标的class
        buts: [
          { id: "create", name: "新增", icon: "createUpBut el-icon-plus" },
          { id: "remove", name: "删除", icon: "removeBut el-icon-delete" },
          { id: "modify", name: "修改", icon: "updateBut el-icon-edit-outline" }
        ]
      },
      {
        id: "333",
        name: "张四333",
        pId: "22",
        disabled: false, // 是否禁用
        checked: false, // 是否默认选中
        icon: "el-icon-folder-opened", // 自定义图片路径或者是文字图标的class
        buts: [
          { id: "create", name: "新增", icon: "createUpBut el-icon-plus" },
          { id: "remove", name: "删除", icon: "removeBut el-icon-delete" },
          { id: "modify", name: "修改", icon: "updateBut el-icon-edit-outline" }
        ]
      }
    ];
  },
  components: { Tree },
  methods: {
    edvsTreeHandle(data) {
      // 树形组件事件触发时,调用这个方法
      let handleName = data.handleName; // 触发的 事件名
      let node = data.node; // 触发事件的节点
      if (handleName === "clicked") {
        // 点击节点名称
        console.log("点击节点名字: ");
        this.$refs["child-tree"].changeButs(node.id, [
          { id: "create", name: "新增", icon: "createUpBut el-icon-plus" },
          { id: "remove", name: "删除", icon: "createUpBut el-icon-plus" },
          { id: "modify", name: "修改", icon: "createUpBut el-icon-plus" }
        ]);
        //this.$refs['child-tree'].nodeCheckState([{id: node.id, checked: true}]);
      } else if (handleName === "open") {
        // 展开或收缩
        console.log(node.open ? "展开" : "收缩");
      } else if (handleName === "checked") {
        console.log(node.checked ? "选中" : "取消");
      } else if (handleName === "butClick") {
        // 点击自定义按钮
        let butId = data.butId;
        console.log("选中的按钮编号: " + butId, "回调函数: callback");
        // callback(); 如果传空值,表示删除, 传一个新的node表示创建, 如果是已有的node则表示修改
        if (butId === "create") {
          data.resolve({ id: "123456789", name: "123456789" });
        } else if (butId === "modify") {
          node.name = "test11";
          node.buts.push({
            id: "create",
            name: "新增",
            icon: "createUpBut el-icon-plus"
          });
          data.resolve(node);
        } else {
          data.resolve();
        }
      }
    },
    loadNode(node, res) {
      // 懒加载
      // node: 展开的父节点, resolve: 回调钩子
      if (node.id === "1585294301005") {
        setTimeout(() => {
          res([
            {
              id: "test1",
              name: "test1",
              parentId: "1585294301005",
              isLeaf: false
            },
            {
              id: "test2",
              name: "test2",
              parentId: "1585294301005",
              isLeaf: false
            },
            {
              id: "test3",
              name: "test3",
              parentId: "1585294301005",
              isLeaf: true
            }
          ]);
        }, 100);
      } else if (node.id === "test1" || node.id === "test2") {
        res(null);
      }
    }
  }
};
</script>

<style module>
* {
  padding: 0px;
  margin: 0px;
}

html {
  color: black;
}

.testDiv {
  height: 600px;
  width: 400px;
}
</style>