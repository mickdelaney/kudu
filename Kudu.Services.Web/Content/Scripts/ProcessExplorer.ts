/// <reference path="../../Scripts/typings/jquery/jquery.d.ts"/>
/// <reference path="../../Scripts/typings/jqueryui/jqueryui.d.ts"/>
/// <reference path="../../Scripts/typings/jquery.contextMenu/jquery.contextMenu.d.ts"/>

interface JQueryStatic {
    whenAll: (any) => any;
}

interface JQuery {
    contextMenu(options?: JQueryContextMenuOptions): JQuery;
}

interface IDisplayableObject {
    dialog(): JQuery;
    tableCells(): string[];
    updateSelf(): JQueryXHR;
}

interface IProcessJson {
    id: number;
    name: string;
    href: string;
    minidump: string;
    gcdump: string;
    parent: string;
    children: string[];
    threads: Thread[];
    open_file_handles: Handle[];
    modules: Module[];
    file_name: string;
    handle_count: number;
    module_count: number;
    thread_count: number;
    start_time: Date;
    total_cpu_time: string;
    user_cpu_time: string;
    privileged_cpu_time: string;
    working_set: number;
    peak_working_set: number;
    private_memory: number;
    virtual_memory: number;
    peak_virtual_memory: number;
    paged_system_memory: number;
    non_paged_system_memory: number;
    paged_memory: number;
    peak_paged_memory: number;
}

interface IThreadJson {
    id: number;
    href: string;
    process: string;
    start_address: string;
    current_priority: number;
    priority_level: number;
    base_priority: number;
    start_time: string;
    total_processor_time: string;
    user_processor_time: string;
    priviledged_processor_time: string;
    state: string;
    wait_reason: string;
}

interface IModuleJson {
    base_address: string;
    file_name: string;
    href: string;
    file_path: string;
    module_memory_size: number;
    file_version: string;
    file_description: string;
    product: string;
    product_version: string;
    is_debug: boolean;
    language: string;
}

class Utilities {

    static toRow(name: any, value: any): HTMLDivElement {
        var div = document.createElement("div");
        div.className = "erow col-s-12";

        var namediv = document.createElement("div");
        namediv.className = "col-xs-5";
        var strong = document.createElement("strong");
        strong.textContent = name ? name.toString() : "NaN";
        namediv.appendChild(strong);

        var valuediv = document.createElement("div");
        valuediv.textContent = typeof (value) !== "undefined" ? value.toString() : "NaN";

        div.appendChild(namediv);
        div.appendChild(valuediv);
        return div;
    }

    static errorDiv(value: string): HTMLDivElement {
        var div = document.createElement("div");
        div.className = "red-error";
        div.textContent = value;
        return div;
    }

    static makeDialog(jquery: JQuery, height: number): JQuery {
        return jquery.dialog({
            autoOpen: false,
            width: "auto",
            height: height,
            buttons: {
                "Ok": function () {
                    $(this).dialog("close");
                },
                "Cancel": function () {
                    $(this).dialog("close");
                }
            }
        }).css("min-width", 600);
    }

    static makeArrayTable(id: string, headers: string[], objects: IDisplayableObject[], attachedData: string = null, htmlIndex: number = -1): HTMLTableElement {
        var table = document.createElement("table");
        table.id = id;
        table.className = "table table-hover table-condensed";
        var tbody = document.createElement("tbody");
        var trHead = document.createElement("tr");
        for (var i = 0; i < headers.length; i++) {
            var thHead = document.createElement("th");
            thHead.textContent = headers[i];
            trHead.appendChild(thHead);
            tbody.appendChild(trHead);
        }

        for (var i = 0; i < objects.length; i++) {
            var cells = objects[i].tableCells();
            var row = document.createElement("tr");
            for (var j = 0; j < cells.length; j++) {
                var cell = document.createElement("td");
                j === htmlIndex ? cell.innerHTML = cells[j] : cell.textContent = cells[j];
                row.appendChild(cell);
            }
            if (attachedData !== null) {
                $(row).data(attachedData, objects[i]);
            }
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        return table;
    }

    static getArrayFromJson<T>(jsonArray: any, action: (any) => T): T[] {
        var array: T[] = [];
        for (var i = 0; i < jsonArray.length; i++) {
            array.push(action(jsonArray[i]));
        }
        return array;
    }

    static createDiv(id: string): HTMLDivElement {
        var div = document.createElement("div");
        div.id = id;
        return div;
    }

    static commaSeparateNumber(val: number): string {
        var strVal = Math.floor(val).toString(10);
        while (/(\d+)(\d{3})/.test(strVal)) {
            strVal = strVal.replace(/(\d+)(\d{3})/, "$1" + "," + "$2");
        }
        return strVal;
    }

    static createTabs(baseId: string, tabsHeaders: string[]): JQuery {

        var tabs = Utilities.createDiv(baseId + "-tabs");

        var ul = document.createElement("ul");

        for (var i = 0; i < tabsHeaders.length; i++) {
            var tab = document.createElement("li");
            var anchor = document.createElement("a");
            anchor.setAttribute("href", "#" + baseId + "-" + tabsHeaders[i].toLowerCase() + "-tab");
            anchor.textContent = tabsHeaders[i];
            tab.appendChild(anchor);
            ul.appendChild(tab);
        }
        tabs.appendChild(ul);
        return $(tabs);
    }

    static makeSimpleMenu(data: string): JQueryContextMenuOptions {
        var options: JQueryContextMenuOptions = {
            selector: "tr",
            trigger: "right",
            callback: function (key) {
                var object = $(this).data(data);
                switch (key) {
                    case "properties":
                        object.dialog().dialog("open");
                        break;
                }
            },
            items: {
                "properties": { name: "Properties" }
            },
            events: {
                hide: function () {
                    $(this).removeClass("selectedMenu");
                },
                show: function () {
                    $(this).addClass("selectedMenu");
                }
            }
        };
        return options;
    }

    static downloadURL(url: string) {
        var hiddenIFrameID = "hiddenDownloader",
            iframe: any;
        iframe = document.getElementById(hiddenIFrameID);
        if (iframe === null) {
            iframe = document.createElement("iframe");
            iframe.id = hiddenIFrameID;
            iframe.style.display = "none";
            document.body.appendChild(iframe);
        }
        iframe.src = url;
    }

    static arrayToDivs(lines: string[]) {
        var htmls = [];
        var tmpDiv = jQuery(document.createElement("div"));
        for (var i = 0; i < lines.length; i++) {
            htmls.push(tmpDiv.text(lines[i]).html());
        }
        return htmls.join("<br />");
    }

}

class Process {

    private _json: IProcessJson;
    HTMLElement: JQuery;

    constructor(json: any) {
        this._json = json;
        this._json.threads = Utilities.getArrayFromJson<Thread>(json.threads, (t) => new Thread(t));
        this._json.modules = Utilities.getArrayFromJson<Module>(json.modules, (m) => new Module(m));
        this._json.open_file_handles = Utilities.getArrayFromJson<Handle>(json.open_file_handles, (h) => new Handle(h));
    }

    get Id(): number {
        return this._json.id;
    }

    get Name(): string {
        return this._json.name;
    }

    get FileHandles(): Handle[] {
        return this._json.open_file_handles;
    }

    get Minidumb(): string {
        return this._json.minidump;
    }

    get Gcdump(): string {
        return this._json.gcdump;
    }

    get ChildrenIds(): number[] {
        var childrenIds: number[] = [];
        var child: string;
        for (child in this._json.children) {
            childrenIds.push(Process.getIdFromHref(child));
        }
        return childrenIds;
    }

    get ParentId(): number {
        return Process.getIdFromHref(this._json.parent);
    }

    get TotalCpuTime(): string {
        if (!this._json.total_cpu_time) {
            return "  ?";
        }
        var total = 0;
        var parts = this._json.total_cpu_time.split(":");
        total += parseInt(parts[0]) * 60;
        total += parseInt(parts[1]) * 60;
        total += parseInt(parts[2]);
        if (total !== 0) {
            return "  " + total.toString() + " s";
        } else {
            return "<1 s";
        }
    }

    tableRow(level: number): JQuery {
        var current = '<tr data-depth="' + level + '" class="collapsable hoverable">';
        current += '<td style="padding-left: ' + (level === 0 ? 5 : level * 30) + 'px">' + (this._json.children.length > 0 ? '<span class="toggle"></span>   ' : '') + this.FullName + '</td>';
        current += "<td>" + this._json.id + "</td>";
        current += "<td>" + this.TotalCpuTime + "</td>";
        current += "<td>" + Utilities.commaSeparateNumber(this._json.working_set / 1024) + " K</td>";
        current += "<td>" + Utilities.commaSeparateNumber(this._json.private_memory / 1024) + " K</td>";
        current += "<td>" + Utilities.commaSeparateNumber(this._json.thread_count) + "</td>";
        current += "</tr>";
        return $(current);
    }

    dialog(): JQuery {
        if ($("#" + this._json.id.toString()).length > 0) {
            return $("#" + this._json.id.toString());
        }

        var div = Utilities.createDiv(this._json.id.toString());
        div.setAttribute("title", this.FullName + ":" + this._json.id + " Properties");

        this.getProcessDatailsTabsHeaders().appendTo(div);

        this.getInfoTab().appendTo(div);
        this.getModulesTab().appendTo(div);
        this.getOpenHandlesTab().appendTo(div);
        this.getThreadsTab().appendTo(div);

        return Utilities.makeDialog($(div).tabs(), 800);
    }

    get FullName(): string {
        return (this._json.file_name === "N/A" ? this._json.name : this._json.file_name.split("\\").pop());
    }

    getOpenHandlesTab(): JQuery {
        var div = Utilities.createDiv(this._json.id.toString() + "-handles-tab");
        var table = Utilities.makeArrayTable(div.id + "-table", ["Handles"], this._json.open_file_handles);
        div.appendChild(table);
        return $(div).hide();
    }

    getThreadsTab(): JQuery {
        var div = Utilities.createDiv(this._json.id.toString() + "-threads-tab");

        var table = Utilities.makeArrayTable(div.id + "-table", ["Id", "State"], this._json.threads, "thread");
        div.appendChild(table);

        $(table).contextMenu(Utilities.makeSimpleMenu("thread"));

        return $(div).hide();
    }

    getInfoTab(): JQuery {
        var div = Utilities.createDiv(this._json.id.toString() + "-general-tab");

        div.appendChild(Utilities.toRow("id", this._json.id));
        div.appendChild(Utilities.toRow("name", this._json.name));
        div.appendChild(Utilities.toRow("file name", this._json.file_name));
        div.appendChild(Utilities.toRow("handle count", Utilities.commaSeparateNumber(this._json.handle_count)));
        div.appendChild(Utilities.toRow("module countid", Utilities.commaSeparateNumber(this._json.module_count)));
        div.appendChild(Utilities.toRow("thread count", Utilities.commaSeparateNumber(this._json.thread_count)));
        div.appendChild(Utilities.toRow("start time", this._json.start_time));
        div.appendChild(Utilities.toRow("total cpu time", this._json.total_cpu_time));
        div.appendChild(Utilities.toRow("user cpu time", this._json.user_cpu_time));
        div.appendChild(Utilities.toRow("privileged cpu time", this._json.privileged_cpu_time));
        div.appendChild(Utilities.toRow("working set", Utilities.commaSeparateNumber(this._json.working_set / 1024) + " K"));
        div.appendChild(Utilities.toRow("peak working set", Utilities.commaSeparateNumber(this._json.peak_working_set / 1024) + " K"));
        div.appendChild(Utilities.toRow("private memory", Utilities.commaSeparateNumber(this._json.private_memory / 1024) + " K"));
        div.appendChild(Utilities.toRow("virtual memory", Utilities.commaSeparateNumber(this._json.virtual_memory / 1024) + " K"));
        div.appendChild(Utilities.toRow("peak virtual memory", Utilities.commaSeparateNumber(this._json.peak_virtual_memory / 1024) + " K"));
        div.appendChild(Utilities.toRow("paged system memory", Utilities.commaSeparateNumber(this._json.paged_system_memory / 1024) + " K"));
        div.appendChild(Utilities.toRow("non-paged system memory", Utilities.commaSeparateNumber(this._json.non_paged_system_memory / 1024) + " K"));
        div.appendChild(Utilities.toRow("paged memory", Utilities.commaSeparateNumber(this._json.paged_memory / 1024) + " K"));
        div.appendChild(Utilities.toRow("peak paged memory", Utilities.commaSeparateNumber(this._json.peak_paged_memory / 1024) + " K"));

        var buttonDiv = document.createElement("div");
        buttonDiv.className = "buttons-row col-xs-12";

        buttonDiv.appendChild(Process.getButton("ui-button-danger", div.id + "-kill", "Kill", () => {
            this.HTMLElement.removeClass("hoverable");
            this.HTMLElement.addClass("dying");
            this.kill().done(() => {
                processExplorerSetupAsync();
                this.dialog().dialog("close");
            });
        }));

        buttonDiv.appendChild(Process.getButton("ui-button-info", div.id + "-dumb", "Download memory dump", () => {
            Utilities.downloadURL(this._json.minidump);
        }));

        buttonDiv.appendChild(Process.getButton("ui-button-info", div.id + "-gcdumb", "Download GC dump", () => {
            Utilities.downloadURL(this._json.gcdump);
        }));

        div.appendChild(buttonDiv);

        return $(div).hide();
    }

    getModulesTab(): JQuery {
        var div = document.createElement("div");
        div.id = this._json.id.toString() + "-modules-tab";

        var table = Utilities.makeArrayTable(div.id + "-table", ["BaseAddress", "File Name", "File Version"], this._json.modules, "module", 1);
        div.appendChild(table);
        $(table).contextMenu(Utilities.makeSimpleMenu("module"));

        return $(div).hide();
    }

    getProcessDatailsTabsHeaders(): JQuery {

        return Utilities.createTabs(this._json.id.toString(), ["General", "Modules", "Handles", "Threads"]);
    }

    kill(): JQueryXHR {
        return $.ajax({
            url: this._json.href,
            type: "DELETE"
        });
    }

    static getButton(style: string, id: string, textContent: string, action: () => void): HTMLButtonElement {
        var button = document.createElement("button");
        button.className = style;
        button.id = id;
        button.textContent = textContent;

        $(button).button().click(() => {
            action();
            $(button).blur();
        }).css("margin-right", "20px");
        return button;
    }

    static getIdFromHref(href: string): number {
        return parseInt(href.substr(href.lastIndexOf("/") + 1));
    }


}

class Thread implements IDisplayableObject {

    private _json: IThreadJson;

    constructor(json: IThreadJson) {
        this._json = json;
    }

    dialog(): JQuery {
        if ($("#" + this._json.id.toString() + "-thread").length > 0) {
            return $("#" + this._json.id.toString() + "-thread");
        }

        var div = document.createElement("div");
        div.id = this._json.id.toString() + "-thread";
        div.setAttribute("title", "Thread " + this._json.id + " Properties");

        this.getInfo().appendTo(div);

        return Utilities.makeDialog($(div), 400);
    }

    tableCells(): string[] {
        return [this._json.id.toString(), this._json.state];
    }

    updateSelf(): JQueryXHR {
        return $.getJSON(this._json.href, (response) => {
            this._json = response;
        });
    }

    getInfo(): JQuery {
        var div = document.createElement("div");
        div.id = this._json.id.toString() + "-info-tab";
        this.updateSelf().done(() => {
            div.appendChild(Utilities.toRow("id", this._json.id));
            div.appendChild(Utilities.toRow("start address", this._json.start_address));
            div.appendChild(Utilities.toRow("current priority", this._json.current_priority));
            div.appendChild(Utilities.toRow("priority_level", this._json.priority_level));
            div.appendChild(Utilities.toRow("base_priority", this._json.base_priority));
            div.appendChild(Utilities.toRow("start time", this._json.start_time));
            div.appendChild(Utilities.toRow("total processor time", this._json.total_processor_time));
            div.appendChild(Utilities.toRow("user processor time", this._json.user_processor_time));
            div.appendChild(Utilities.toRow("priviledged processor time", this._json.priviledged_processor_time));
            div.appendChild(Utilities.toRow("state", this._json.state));
            div.appendChild(Utilities.toRow("wait reason", this._json.wait_reason));
        }).fail(() => {
                div.appendChild(Utilities.errorDiv("Couldn't retrive thread details"));
            });

        return $(div);
    }
}

class Module implements IDisplayableObject {

    private _json: IModuleJson;
    constructor(json: IModuleJson) {
        this._json = json;
    }

    updateSelf(): JQueryXHR {
        return $.getJSON(this._json.href, (response) => {
            this._json = response;
        });
    }

    tableCells(): string[] {
        return [this._json.base_address, "<strong>" + this._json.file_name + "</strong>", this._json.file_version];
    }

    dialog(): JQuery {
        if ($("#" + this._json.base_address.toString() + "-module").length > 0) {
            return $("#" + this._json.base_address.toString() + "-module");
        }

        var div = document.createElement("div");
        div.id = this._json.base_address.toString() + "-module";
        div.setAttribute("title", "module at " + this._json.base_address + " Properties");

        this.getInfo().appendTo(div);

        return Utilities.makeDialog($(div), 400);
    }

    getInfo(): JQuery {
        var div = document.createElement("div");
        div.id = this._json.base_address.toString() + "-module-info-tab";
        this.updateSelf().done(() => {
            div.appendChild(Utilities.toRow("base address", this._json.base_address));
            div.appendChild(Utilities.toRow("file name", this._json.file_name));
            div.appendChild(Utilities.toRow("module memory size", this._json.module_memory_size));
            div.appendChild(Utilities.toRow("file version", this._json.file_version));
            div.appendChild(Utilities.toRow("file description", this._json.file_description));
            div.appendChild(Utilities.toRow("product", this._json.product));
            div.appendChild(Utilities.toRow("product version", this._json.product_version));
            div.appendChild(Utilities.toRow("is debug", this._json.is_debug));
            div.appendChild(Utilities.toRow("language", this._json.language));
        }).fail(() => {
                div.appendChild(Utilities.errorDiv("Couldn't retrive module details"));
            });

        return $(div);
    }
}

class Handle implements IDisplayableObject {
    file_name: string;
    constructor(fileName: string) {
        this.file_name = fileName;
    }

    dialog(): JQuery {
        throw "Not Implemented";
    }

    tableCells(): string[] {
        return [this.file_name];
    }

    updateSelf(): JQueryXHR {
        throw "Not Implemented";
    }
}

class Tree {
    roots: ProcessNode[];

    constructor() {
        this.roots = [];
    }

    contains(pid: number): boolean {
        for (var i = 0; i < this.roots.length; i++) {
            if (Tree.recursiveContains(this.roots[i], pid)) {
                return true;
            }
        }
        return false;
    }

    buildTree(nodeList: ProcessNode[]) {
        nodeList.sort((a, b) => a.process.Id - b.process.Id);
        this.roots.sort((a, b) => a.process.Id - b.process.Id);
        for (var i = 0; i < this.roots.length; i++) {
            Tree.addChildren(this.roots[i], nodeList);
        }
        $(".collapsable").remove();
        $(".expandable").remove();
        for (var i = 0; i < this.roots.length; i++) {
            Tree.printTreeTable(this.roots[i], 0, $("#proctable"));
        }
    }

    static recursiveContains(node: ProcessNode, pid: number): boolean {
        if (node.process.Id === pid) {
            return true;
        } else {
            for (var i = 0; i < node.children.length; i++) {
                if (Tree.recursiveContains(node[i], pid)) {
                    return true;
                }
            }
        }
        return false;
    }

    static addChildren(node: ProcessNode, nodeList: ProcessNode[]) {
        for (var i = 0; i < nodeList.length; i++) {
            if (nodeList[i].process.ParentId === node.process.Id) {
                node.children.push(nodeList[i]);
            }
        }

        for (var i = 0; i < node.children.length; i++) {
            Tree.addChildren(node.children[i], nodeList);
        }
    }

    static printTreeTable(node: ProcessNode, level: number, tableRoot: JQuery) {
        var jcurrent = node.process.tableRow(level);
        jcurrent.data("proc", node.process).appendTo(tableRoot);
        node.process.HTMLElement = jcurrent;
        for (var i = 0; i < node.children.length; i++) {
            Tree.printTreeTable(node.children[i], level + 1, tableRoot);
        }
    }

    //debug method leave it
    static printTreeUl(node: ProcessNode, parent: JQuery) {
        var current = "<li><span>";
        current += "(" + node.process.Id + ") " + node.process.Name;
        current += "</span></li>";
        var jcurrent = $(current).appendTo(parent);
        if (node.children.length > 0) {
            jcurrent = $("<ul></ul>").appendTo(jcurrent);
            for (var i = 0; i < node.children.length; i++) {
                Tree.printTreeUl(node.children[i], jcurrent);
            }
        }
    }

    //debug method leave it
    static printTreeConsole(node: ProcessNode, level: number) {
        var indentation = "";
        for (var i = 0; i < level - 1; i++) {
            indentation += "    ";
        }
        if (indentation.length != 0 || level > 0) indentation += "|__>";
        console.log(indentation + "(" + node.process.Id + ") " + node.process.Name);
        for (var i = 0; i < node.children.length; i++) {
            Tree.printTreeConsole(node.children[i], level + 1);
        }
    }
}

class ProcessNode {
    process: Process;
    children: ProcessNode[];

    constructor(process: Process) {
        this.process = process;
        this.children = [];
    }
}

var nodeList: ProcessNode[];

function processExplorerSetupAsync() {
    $("#proc-loading").show();
    var processTree = new Tree();
    nodeList = [];
    var deferred: JQueryPromise<any>[] = [];
    $.getJSON("/diagnostics/processes", (data) => {
        //setup tree
        for (var i = 0; i < data.length; i++) {
            deferred.push($.getJSON(data[i].href, (response) => {
                var p: Process = new Process(response);
                var processNode = new ProcessNode(p);
                if (p.ParentId === -1) {
                    processTree.roots.push(processNode);
                }
                nodeList.push(new ProcessNode(p));
            }));
        }
    }).done(() => $.whenAll.apply($, deferred).then(() => processTree.buildTree(nodeList), () => processTree.buildTree(nodeList)).always(() => $("#proc-loading").hide()));
}

function enableCollabsableNodes() {
    //http://stackoverflow.com/questions/5636375/how-to-create-a-collapsing-tree-table-in-html-css-js
    $("#proctable").on("click", ".toggle", function (e) {
        e.preventDefault();
        e.stopPropagation();
        //Gets all <tr>"s  of greater depth
        //below element in the table
        //TODO: change back to tr if there is an issue
        var findChildren = (_tr) => {
            var depth = _tr.data("depth");
            return _tr.nextUntil($("tr").filter(function () {
                return $(this).data("depth") <= depth;
            }));
        };

        var el = $(this);
        var tr = el.closest("tr"); //Get <tr> parent of toggle button
        var children = findChildren(tr);

        //Remove already collapsed nodes from children so that we don"t
        //make them visible.
        var subnodes = children.filter(".expandable");
        subnodes.each(function () {
            var subnode = $(this);
            var subnodeChildren = findChildren(subnode);
            children = children.not(subnodeChildren);
        });

        //Change icon and hide/show children
        if (tr.hasClass("collapsable")) {
            tr.removeClass("collapsable").addClass("expandable");
            children.hide();
        } else {
            tr.removeClass("expandable").addClass("collapsable");
            children.show();
        }
        return children;
    });
}

function overrideRightClickMenu() {
    var options: JQueryContextMenuOptions = {
        selector: "tr",
        trigger: "both",
        callback: function (key) {
            var process = $(this).data("proc");
            switch (key) {
                case "kill":
                    $(this).removeClass("hoverable");
                    $(this).addClass("dying");
                    process.kill().done(() => processExplorerSetupAsync()).fail(() => processExplorerSetupAsync());
                    break;
                case "dump1":
                    Utilities.downloadURL(process.Minidump + "?dumpType=1");
                    break;
                case "dump2":
                    Utilities.downloadURL(process.Minidump + "?dumpType=2");
                    break;
                case "gcdump":
                    Utilities.downloadURL(process.Gcdump);
                    processExplorerSetupAsync();
                    break;
                case "properties":
                    process.dialog().dialog("open");
                    $("li").blur();
                    break;
            }
        },
        items: {
            "kill": { name: "Kill" },
            "dump": {
                name: "Download Memory Dump",
                "items": {
                    "dump1": { name: "Mini Dump" },
                    "dump2": { name: "Full Dump" }
                }
            },
            "gcdump": { name: "Download GC Dump" },
            "sep1": "---------",
            "properties": { name: "Properties" }
        },
        events: {
            hide: function () {
                $(this).removeClass("selectedMenu");
            },
            show: function () {
                $(this).addClass("selectedMenu");
            }
        }
    };
    $("#proctable").contextMenu(options);
}

function searchForHandle() {
    var name = $("#name").val().toLowerCase();
    var result: string[] = [];
    for (var i = 0; i < nodeList.length; i++) {
        for (var j = 0; j < nodeList[i].process.FileHandles.length; j++) {
            var check = nodeList[i].process.FileHandles[j].file_name.replace(/\\+$/, "").toLowerCase();
            check = check.substring(check.lastIndexOf("\\"));
            if (check.indexOf(name) !== -1) {
                result.push(nodeList[i].process.FullName + ":" + nodeList[i].process.Id + " -> " + nodeList[i].process.FileHandles[j].file_name);
            }
        }
    }
    if (result.length > 0) {
        $("#handle-result").html(Utilities.arrayToDivs(result));
    } else {
        $("#handle-result").html(Utilities.errorDiv("No handle found").outerHTML);
    }
}

window.onload = () => {
    //http://stackoverflow.com/questions/5518181/jquery-deferreds-when-and-the-fail-callback-arguments
    $.whenAll = (firstParam: any) => {
        var args = arguments,
            sliceDeferred = [].slice,
            i = 0,
            length = args.length,
            count = length,
            rejected,
            deferred: any = length <= 1 && firstParam && jQuery.isFunction(firstParam.promise)
            ? firstParam
            : jQuery.Deferred();

        function resolveFunc(i, reject) {
            return function (value) {
                rejected |= reject;
                args[i] = arguments.length > 1 ? sliceDeferred.call(arguments, 0) : value;
                if (!(--count)) {
                    // Strange bug in FF4:
                    // Values changed onto the arguments object sometimes end up as undefined values
                    // outside the $.when method. Cloning the object into a fresh array solves the issue
                    var fn = rejected ? deferred.rejectWith : deferred.resolveWith;
                    fn.call(deferred, deferred, sliceDeferred.call(args, 0));
                }
            };
        }

        if (length > 1) {
            for (; i < length; i++) {
                if (args[i] && jQuery.isFunction(args[i].promise)) {
                    args[i].promise().then(resolveFunc(i, false), resolveFunc(i, true));
                } else {
                    --count;
                }
            }
            if (!count) {
                deferred.resolveWith(deferred, args);
            }
        } else if (deferred !== firstParam) {
            deferred.resolveWith(deferred, length ? [firstParam] : []);
        }
        return deferred.promise();
    };

    $("#find-file-handle").button().click(() => {
        $("#dialog-form").dialog("open");
    });

    $("#dialog-form").dialog({
        autoOpen: false,
        height: 300,
        buttons: {
            "Search": () => searchForHandle(),
            Cancel: function () {
                $(this).dialog("close");
            }
        }
    });

    $("#dialog-form").keypress(function (e) {
        if (e.keyCode === $.ui.keyCode.ENTER) {
            e.preventDefault();
            e.stopPropagation();
            searchForHandle();
        }
    });

    processExplorerSetupAsync();
    enableCollabsableNodes();
    overrideRightClickMenu();
}