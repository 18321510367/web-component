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
    />
  </div>
</template>
<script>
import { Node } from "../../js/utils.js";
import TreeList from "./tree-list.vue";

export default {
  name: "web-tree",
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
    load: Function,
    allowDrag: Function,
    allowDrop: Function
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
          node.buts = node.buts || this.opts.buts;

          // 建立子节点
          if (!tree[node.pId]) {
            tree[node.pId] = new Node({});
          }
          tree[node.pId].addChild(node);
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
      this.$emit("tree-handle", {
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
      this.$emit("tree-handle", {
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
            if (!checked) {
              let hasCheck = parent.children.find(n => n.checked);
              if (hasCheck) break;
            }
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
      this.$emit("tree-handle", {
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
        this.$emit("tree-handle", {
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
          data.pId = node.id;
          if (map[data.id]) {
            // 修改
            node.clone(data);
            node.clicked = data.clicked;
            map[node.id] = node;
          } else {
            let nNode = new Node(data);
            nNode.buts = nNode.buts || this.opts.buts;
            map[data.id] = nNode;
            node.addChild(nNode);
            node.open = true;
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
  mounted() {
    let node;
    this.$el.addEventListener(
      "mousedown",
      event => {
        if (!this.opts.draggable) return;
        let { el, n } = getNode.call(this, event.target);
        node = n;
        if (node) {
          node.draggable =
            typeof this.allowDrag === "function"
              ? this.allowDrag(node.getParam())
              : true;
        }
      },
      false
    );

    let overNode;
    let currentOverEl;
    this.$el.addEventListener(
      "dragover",
      event => {
        if (!this.opts.draggable) return;
        let { el, n } = getNode.call(this, event.target);
        if (currentOverEl && el !== currentOverEl) {
          ["drag-over-pre", "drag-over-inner", "drag-over-next"].forEach(
            clas => {
              clas = this.$style[clas];
              if (currentOverEl.classList.contains(clas)) {
                currentOverEl.classList.remove(clas);
              }
            }
          );
        }
        currentOverEl = el;
        if (n !== node) {
          let { top, bottom, height } = el.children[0].getBoundingClientRect();
          let pre = top + height * 0.25;
          let next = top + height * 0.75;
          let y = event.clientY;
          let addClass;
          let classList = el.classList;
          if (y >= top && y < pre) {
            addClass = "pre";
          } else if (y >= pre && y <= next) {
            addClass = "inner";
          } else if (y <= bottom && y > next) {
            addClass = "next";
          } else {
            return;
          }
          let allowDrop =
            n && typeof this.allowDrop === "function"
              ? this.allowDrop(n.getParam(), node.getParam(), addClass)
              : true;
          if (!allowDrop) return;
          ["drag-over-pre", "drag-over-inner", "drag-over-next"].forEach(
            clas => {
              clas = this.$style[clas];
              if (classList.contains(clas) && clas.indexOf(addClass) < 0) {
                classList.remove(clas);
              } else if (
                !classList.contains(clas) &&
                clas.indexOf(addClass) > -1
              ) {
                classList.add(clas);
              }
            }
          );
          overNode = n;
          event.preventDefault();
        }
      },
      false
    );

    this.$el.addEventListener(
      "dragend",
      event => {
        if (overNode && currentOverEl && node) {
          let insertPosition;
          ["drag-over-pre", "drag-over-inner", "drag-over-next"].forEach(
            (clas, i) => {
              clas = this.$style[clas];
              if (currentOverEl.classList.contains(clas)) {
                insertPosition = i;
                currentOverEl.classList.remove(clas);
              }
            }
          );
          currentOverEl = null;
          if (insertPosition > -1) {
            let nodeArr;
            if (node.pId) {
              nodeArr = node.parent.children;
              if (nodeArr.length === 1) node.parent.hasChild = false;
            } else {
              nodeArr = this.tree;
            }
            let nodeIndex = nodeArr.findIndex(an => an.id === node.id);
            if (nodeIndex > -1) {
              nodeArr.splice(nodeIndex, 1);
            }
            if (insertPosition === 1) {
              node.pId = overNode.id;
              node.parent = overNode.parent;
              overNode.open = true;
              overNode.addChild(node);
            } else if (insertPosition === 0 || insertPosition === 2) {
              if (overNode.pId) {
                nodeArr = overNode.parent.children;
              } else {
                nodeArr = this.tree;
              }
              let overNodeIndex = nodeArr.findIndex(
                an => an.id === overNode.id
              );
              if (overNodeIndex > -1) {
                node.pId = overNode.pId;
                node.parent = overNode.parent;
                nodeArr.splice(
                  insertPosition ? overNodeIndex + 1 : overNodeIndex,
                  0,
                  node
                );
              }
            }
          }
        }
        if (node) {
          node.draggable = false;
          node = null;
        }
      },
      false
    );

    function getNode(el) {
      let nodeId = el.dataset.treeNodeid;
      while (!nodeId && el !== this.$el) {
        el = el.parentElement;
        nodeId = el.dataset.treeNodeid;
      }
      return { el, n: this.hashNodeTable[nodeId] };
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

.tree ul,
.tree li {
  width: 100%;
  list-style-type: none;
}

.drag-over-pre > div {
  border-top: 1px solid #5786c0;
}

.drag-over-inner > div span[title] {
  background: #5786c0;
}

.drag-over-next > div {
  border-bottom: 1px solid #5786c0;
}

.drag-over-pre > div {
  border-top: 1px solid #5786c0;
}

.drag-over-inner > div span[title] {
  background: #5786c0;
}

.drag-over-next > div {
  border-bottom: 1px solid #5786c0;
}

.drag-over-pre > div::before,
.drag-over-inner > div::before,
.drag-over-next > div::before {
  color: rgba(255, 0, 0, 0.8);
  font-size: 25px;
  font-weight: 900;
  position: absolute;
  top: 50%;
  left: 0px;
  display: inline-block;
  transform: translateY(-50%);
  font: normal normal normal 14px/1 element-icons;
}

.drag-over-pre > div::before {
  content: "\e6e6";
}

.drag-over-inner > div::before {
  content: "\e6ea";
}

.drag-over-next > div::before {
  content: "\e6eb";
}
</style>