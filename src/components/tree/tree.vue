<template>
  <div :class="$style.tree">
    <tree-list
      level="1"
      :nodes="tree"
      :buts="opts.buts"
      :font="opts.font"
      :checkRadio="opts.check && opts.check.checkRadio"
      :checkType="opts.check && opts.check.type"
      @receive-data="receiveData"
    ></tree-list>
  </div>
</template>
<script>
import { Node } from "../../js/classes.js";
import TreeList from "./tree-list.vue";

export default {
  name: "xx-tree",
  data() {
    return {
      tree: [],
      hashNodeTable: null,
      checkNodeId: null,
      radioAllChecked: null // radio不是level时选中的节点,避免遍历整棵树
    };
  },
  props: {
    opts: Object,
    load: Function
  },
  components: { TreeList },
  created() {
    Node.lazy = this.opts.lazy;
  },
  methods: {
    sort(data) {
      let sortTree = [];
      let keyArr = []; // 保证顺序
      if (Array.isArray(data) && data.length > 0) {
        let tree = {};
        data.forEach(o => {
          let node;
          // 建立父节点
          if (tree[o.id]) {
            node = tree[o.id].clone(o);
          } else {
            node = new Node(o);
            tree[o.id] = node;
          }

          // 建立子节点
          if (!tree[node.parentId]) {
            tree[node.parentId] = new Node({});
          }
          tree[node.parentId].addChild(node);
          keyArr.push(o.id);
        });
        keyArr.forEach(k => tree[k].isRoot() && sortTree.push(tree[k]));
        this.hashNodeTable = tree;
      }
      this.tree = sortTree;
    },
    receiveData(data) {
      let name = data.msgName;
      if (name === "clickHandle") {
        this.childClickHandle(data);
      } else if (name === "open") {
        this.childOpenHandle(data);
      } else if (name === "check") {
        this.childCheckHandle(data);
      } else if (name === "butClick") {
        this.clickButs(data);
      }
    },
    childClickHandle(data) {
      let node = data.node;
      if (this.checkNodeId) {
        let oldNode = this.hashNodeTable[this.checkNodeId];
        if (oldNode) oldNode.clicked = false;
      }
      this.checkNodeId = node.id;
      this.$emit("edvs-tree-handle", {
        handleName: "clicked",
        node: node.getParam()
      });
    },
    childOpenHandle(data) {
      let node = data.node;
      if (typeof this.load === "function" && this.opts.lazy && node.open) {
        new Promise((resolve, reject) => {
          this.load(data.node, resolve, reject);
        }).then(datas => {
          if (Array.isArray(datas) && datas.length > 0) {
            datas.forEach(d => {
              let n = new Node(d);
              node.addChild(n);
              this.hashNodeTable[node.id] = n;
            });
          } else {
            node.hasChild = false;
          }
        });
      }
      this.$emit("edvs-tree-handle", {
        handleName: "open",
        node: node.getParam()
      });
    },
    childCheckHandle(data) {
      // 关联选中
      let node = data.node;
      let inputType = this.opts.check && this.opts.check.type;
      let relation = this.opts.check && this.opts.check.checked;
      if (inputType === "checkbox" && relation) {
        let checked = node.checked;
        if (relation.startsWith("P")) {
          let parent = node.parent;
          while (parent && parent.id) {
            parent.checked = checked;
            parent = parent.parent;
          }
        }
        if (relation.endsWith("C")) {
          let children = node.children;
          let list = [children];
          let i = 0,
            cd;
          while (list[i]) {
            cd = list[i++];
            if (Array.isArray(cd) && cd.length > 0) {
              cd.forEach(child => {
                child.checked = checked;
                if (Array.isArray(child.children) && child.children.length > 0)
                  list.push(child.children);
              });
            }
          }
        }
      } else if (inputType === "radio") {
        if (!node.checked && this.radioAllChecked) {
          this.radioAllChecked = null;
        } else {
          let checkRadio = this.opts.check && this.opts.check.checkRadio;
          if (checkRadio === "level") {
            let levelNodes = node.parent.children;
            levelNodes.forEach(n => {
              if (n.id !== node.id) n.checked = false;
            });
          } else {
            if (this.radioAllChecked) {
              this.radioAllChecked.checked = false;
            }
            this.radioAllChecked = node;
          }
        }
      }
      this.$emit("edvs-tree-handle", {
        handleName: "checked",
        node: node.getParam()
      });
    },
    clickButs(data) {
      // 点击自定义按钮
      let node = data.node;
      let map = this.hashNodeTable;
      if (this.checkNodeId && node.id !== this.checkNodeId) {
        let oldNode = map[this.checkNodeId];
        if (oldNode) oldNode.clicked = false;
      }
      this.checkNodeId = node.id;
      new Promise((res, rej) => {
        this.$emit("edvs-tree-handle", {
          handleName: "butClick",
          node: node.getParam(),
          butId: data.butId,
          resolve: res
        });
      }).then(data => {
        if (!data) {
          // 删除
          let list = node.parent.children;
          for (let i = 0, len = list.length; i < len; i++) {
            if (node.id === list[i].id) {
              list.splice(i, 1);
              break;
            }
          }
          if (list.length === 0) {
            node.parent.open = false;
            node.parent.hasChild = false;
          }
          delete map[node.id];
          let removeAll = c => {
            if (c && c.length > 0) {
              c.forEach(child => {
                delete map[child.id];
                removeAll(c.children);
              });
            }
          };
          removeAll(node.children);
        } else {
          data.parentId = node.id;
          if (map[data.id]) {
            // 修改
            node.clone(data);
            node.clicked = data.clicked;
            map[node.id] = node;
          } else {
            let nNode = new Node(data);
            map[data.id] = nNode;
            node.addChild(nNode);
          }
        }
      });
    },
    nodeCheckState(data) {
      // 勾选或者取消,data: Array | Boolean
      let nodeMap = this.hashNodeTable;
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(o => {
          if (nodeMap[o.id]) {
            nodeMap[o.id].checked = o.checked;
            this.childCheckHandle({ node: nodeMap[o.id] });
          }
        });
      } else if (typeof data === "boolean") {
        for (let k in nodeMap) {
          nodeMap[k].checked = data;
        }
      }
    },
    getCheckNodes() {
      let nodeMap = this.hashNodeTable;
      let nodes = [];
      for (let k in nodeMap) {
        if (nodeMap[k].id && nodeMap[k].checked)
          nodes.push(nodeMap[k].getParam());
      }
      return nodes;
    },
    changeButs(nodeId, buts) {
      let node = this.hashNodeTable[nodeId];
      if (node) this.$set(node, "buts", buts);
    }
  },
  watch: {
    "opts.data": {
      immediate: true,
      handler: function(data) {
        if (data) this.sort(data);
      }
    }
  }
};
</script>

<style module>
.tree {
  width: 100%;
  height: 100%;
}

.tree ul, .tree li {
  width: 100%;
  list-style-type: none;
}
</style>