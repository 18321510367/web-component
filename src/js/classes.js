class Node {
    constructor({id, name, icon, open, pId, isLeaf, checked, disabled, excludeBut, other, buts, font}) { // Node.lazy: 是否启用懒加载
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.pId = pId;
        this.open = !!open;
        this.checked = checked;
        this.disabled = disabled;
        this.clicked = false;
        this.excludeBut = excludeBut;
        this.other = other;
        this.buts = buts;
        this.font = font;
        this.parent = {};
        this.children = [];
        if(typeof isLeaf === 'boolean') {
            this.hasChild = !isLeaf;
        } else {
            this.hasChild = !!Node.lazy;
        }
    }
    
    addChild(node) {
        if(!this.hasChild) this.hasChild = true;
        node.parent = this;
        this.children.push(node);
    }
    
    isRoot() {
        return !this.parent.id;
    }
    
    getParam() {
        return {
            id: this.id,
            name: this.name,
            icon: this.icon,
            open: this.open,
            pId: this.pId,
            checked: this.checked,
            clicked: this.clicked,
            disabled: this.disabled,
            children: this.children,
            buts: this.buts,
            other: this.other,
            font: this.font
        };
    }
    
    clone(o) {
        this.id = o.id;
        this.name = o.name;
        this.icon = o.icon;
        this.open = o.open;
        this.buts = o.buts;
        this.font = o.font;
        this.other = o.other;
        this.isLeaf = o.isLeaf;
        this.checked = o.checked;
        this.disabled = o.disabled;
        this.excludeBut = o.excludeBut;
        this.pId = o.pId;
        return this;
    }
}

export { Node };