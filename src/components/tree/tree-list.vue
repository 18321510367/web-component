<template>
  <ul v-if="nodes">
    <li
      v-for="(node, index) in nodes"
      :key="node.id"
      :draggable="node.draggable"
      :data-tree-nodeId="node.id"
    >
      <div
        :class="$style['tree-item']"
        :data-tree-level="level"
        :data-tree-index="index"
        :style="{paddingLeft: getPaddingLeft()}"
      >
        <i
          :class="[$style['tree-sel'], node.open? 'el-icon-minus': 'el-icon-plus']"
          :style="{visibility: node.hasChild? 'visible': 'hidden'}"
          @click="open"
        ></i>
        <input
          :class="$style['tree-checkInp']"
          v-if="checkType"
          @mousedown="check"
          @click.prevent
          :type="checkType"
          :checked="node.checked"
          :disabled="node.disabled"
          :name="checkType === 'radio' && checkRadio === 'level'? (node.parentId || 'root'): 'tree'"
          :style="{visibility: node.disabled === null? 'hidden': 'visible'}"
        />
        <div
          :class="[$style['tree-ct'], node.clicked? $style['tree-check']: '']"
          @mouseenter="mouseenter"
          @mouseleave="mouseleave"
        >
          <i
            v-if="node.icon"
            :class="[$style['icon'], node.icon && node.icon.indexOf('.') < 0? node.icon: '']"
            :style="getIconStyle(node)"
          ></i>
          <span
            :style="(node.font && node.font.style) || (font && font.style)"
            :title="node.name"
            @click="clickHandle"
          >{{ node.name }}</span>
          <div
            v-if="node.buts"
            :class="[$style['tree-buts-container'], 'tree-buts']"
            :style="{visibility: node.clicked? 'visible': 'hidden'}"
          >
            <i
              v-for="but in node.buts"
              v-show="!(Array.isArray(node.excludeBut) && node.excludeBut.indexOf(but.id) > -1)"
              @click="butsClick"
              :key="but.id"
              :title="but.name"
              :data-tree-butId="but.id"
              :data-tree-index="index"
              :class="[$style['icon'], but.icon && but.icon.indexOf('.') < 0? but.icon: '']"
              :style="{backgroundImage: but.icon && but.icon.indexOf('.') > 0? 'url(' + but.icon + ')': null}"
            ></i>
          </div>
        </div>
      </div>

      <tree-list
        v-show="node.open"
        v-on="$listeners"
        :nodes="node.hasChild? node.children: null"
        :level="Number.parseInt(level) + 1"
        :checkRadio="checkRadio"
        :checkType="checkType"
        :font="font"
        :buts="buts"
      />
    </li>
  </ul>
</template>

<script>
export default {
  name: "tree-list",
  props: {
    buts: Array,
    nodes: Array,
    font: Object,
    level: String | Number,
    checkType: String,
    checkRadio: String
  },
  methods: {
    getPaddingLeft() {
      return (this.level - 1) * 20 + (this.level === 1 ? 4 : 10) + "px";
    },
    getIconStyle(node) {
      let f =
        (node.font && node.font.style) ||
        (this.font && this.font.iconStyle) ||
        {};
      f.backgroundImage =
        node.icon && node.icon.indexOf(".") > 0
          ? "url(" + node.icon + ")"
          : null;
      return f;
    },
    mouseenter(event) {
      let buts = event.target.querySelector(".tree-buts");
      if (buts) buts.style.visibility = "visible";
    },
    mouseleave(event) {
      let el = event.target;
      let buts = el.querySelector(".tree-buts");
      if (!el.classList.contains(this.$style["tree-check"]) && buts)
        buts.style.visibility = "hidden";
    },
    open(event) {
      let index = event.target.parentElement.dataset.treeIndex;
      let n = index && this.nodes && this.nodes[index];
      if (n) n.open = !n.open;
      this.$emit("receive-data", { msgName: "open", node: n });
    },
    clickHandle(event) {
      let index = event.target.parentElement.parentElement.dataset.treeIndex;
      let n = index && this.nodes && this.nodes[index];
      if (n) {
        this.$emit("receive-data", { msgName: "clickHandle", node: n });
        n.clicked = true;
      }
    },
    check(event) {
      // 单选框或多选框,选中或取消
      let el = event.target;
      let index = el.parentElement.dataset.treeIndex;
      let n = index && this.nodes && this.nodes[index];
      if (n && !n.disabled) {
        n.checked = !n.checked;
        this.$emit("receive-data", { msgName: "check", node: n });
      }
    },
    butsClick(event) {
      // 点击按钮组
      let el = event.target;
      let butId = el.dataset.treeButid;
      let index = el.dataset.treeIndex;
      let n = index && this.nodes && this.nodes[index];
      if (butId && n) {
        n.clicked = true;
        this.$emit("receive-data", { msgName: "butClick", node: n, butId });
      }
    }
  }
};
</script>

<style module>
.tree-item {
  width: 100%;
  height: 25px;
  cursor: pointer;
  line-height: 25px;
  font-size: 14px;
  box-sizing: border-box;
  text-align: left;
  white-space: nowrap;
  display: inline-block;
  position: relative;
}

.tree-checkInp {
  width: 15px;
  height: 15px;
  position: relative;
  vertical-align: middle;
}

.tree-check > span[title] {
  background: rgba(221, 221, 221, 1);
}

.tree-item:not(.tree-check):hover {
  background: rgba(221, 221, 221, 0.4);
}

.tree-sel {
  width: 15px;
  height: 15px;
  line-height: 13px;
  text-align: center;
  font-size: 13px;
  margin-left: 4px;
  display: inline-block;
  cursor: pointer;
  color: #000;
  border: 1px solid #000;
  box-sizing: border-box;
}

.tree-ct {
  height: 25px;
  display: inline-block;
  white-space: nowrap;
}

.tree-buts-container {
  display: inline-block;
}

.tree-buts-container > i {
  width: 16px;
  height: 16px;
  font-size: 16px;
  cursor: pointer;
  margin-left: 5px;
}
</style>