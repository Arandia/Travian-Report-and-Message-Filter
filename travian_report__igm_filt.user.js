// ==UserScript==
// @name           Travian Reporter
// @version        5.0.0
// @namespace      TravianReporter
// @author         arandia
// @license        GPL 3 or any later version
// @description    This filters, sorts, prefetches and analyzes your reports and in-game messages

// @include        http://*.travian*.*/berichte.php*
// @include        http://*.travian*.*/nachrichten.php*
// @include        http://*.travian*.*/spieler.php?s=2
// @include        http://*.travian*.*/login.php*
// @exclude        http://forum.travian*.*
// @exclude        http://board.travian*.*
// @exclude        http://shop.travian*.*
// @exclude        http://help.travian*.*
// @exclude        http://*.travian*.*/manual.php*
// ==/UserScript==

/**************************************************************************************
 * Copyright 2008, 2009 Adriaan Tichler
 * Some parts borrowed from Travian Timeline,
 *   Copyright 2008, 2009 by Bauke Conijn, Adriaan Tichler
 *
 * This is free software; you can redistribute it and/or modify it under the
 * terms of the GNU General Public License as published by the Free Software
 * Foundation; either version 3 of the License, or (at your option) any later
 * version.
 *
 * This is distributed in the hopes that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Public License for more details
 *
 * To obtain a copy of the GNU General Public License, please see
 * <http://www.gnu.org.licenses/>
 **************************************************************************************/

// This script has two main purposes:
// 1) Replicate the report filters available with plus
// 2) Add a search to reports and IGMs
//   a. Keep track of a list of vassals to search the reports for

Image = {};
Image['setup'] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAARCAYAAAA/mJfHAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAABOcAAATnABoEjMfQAAAAd0SU1FB9kEHAMkJNkHEo4AAALGSURBVDjLlZRLbJRVFMd/9/E95tF22qktDD5AqrAgCuGxoAETY2LiBo26Y+GGFdEVG2Jc6UbduCBBAwmJG8OSjQG6MSGRwIYQU0EdAmkstqHQMNPOzPd9997jog9aAtGe3Ls753/+/3PP/6q+HccO6nL8vhKJ2GgoTXD+b58VPy7+efaB1eX4g6HxfSeieg0JYWNgInTuTD1sTTavAQ+sEqJyfx/JQD8SZAOsAAGfzAa1XGbLkZFdvstwSBERkOXEZzJZDxaC8Ie4sGhtaAE2sZajb7/Jrtdewnm/2vRZOEHW44UgnNeBO5N3l5gBJOWUK4uCc7Ctark826HjnpR5YDQxHGlUqMdmtWEQIU1iZLmFBdAoXq/GFM4znBj211IKkbVzJjWKslnibAxorchzWcfUAngRbrVynPe8KhFXH/Xo+CdpQYTRxLC1EjFYsnT8QyZnfmNvYxxjFN6vZaagUTIUTlGLNNurEdkaMAGqVlGvlJjP/uHLX04wzU2Otk/S2DzGtpc3FfdvgF55Gq0ULB30UzeI0F8qMded5psrnzM7fJnG7nkutU7Rrd8a/un7Y++IiLIrMu53HYXzlIzidjun48OyRNhSTaibGb6b+IpmfJFGTS0NcmSKC7+fMUOVoS/qg+82LYDVigODCc4Hqlbz4YtVVlSKCANpTGq6vNHYx1/3rpJnMxiryFop9TDGC5WRktJ6s0VC8Wi+zWh9weMDbaD69JJlXXSpj4/2fGx+njpH3vMYq3A5HBo7lB3eOf41cNrOzj2e+PaHCyMa5Z/nHB8kbBkZ0p8df+s978OmPAsYG/C5UDgXiiL8GsemsJ3muYnrTSb+y4rXe1Keak+/Eq7JaMicslYRCg8iKEW0uhr/KxKUtMUsdHr05nLSRQeFoag5veJAu4EPxw1WBtqf7P1UPe7NoTRYFbOnsb9nrV4A+Bc8NzrMTVolUQAAAABJRU5ErkJggg==';

Trans = {};

// For creating/using global variables from local scope
var global = this;

function nothing(){}
function xpath(search, type){
    return document.evaluate(search, document, null, type, null);
}


/*******************************************
 * FEATURE - from Travian Timeline (mostly)
 *******************************************/
Feature=new Object();
Feature.list=[];
Feature.init=nothing;
Feature.run =nothing;
// This is used to create a basic setting
Feature.setting=function(name, def_val, type, typedata, description, hidden, parent_el) {
    var s = new Object();
    if (type==undefined) type=Settings.type.none;
    if (hidden==undefined || typeof(hidden) != 'string') hidden='false';
    s.__proto__ = Settings;
    s.fullname = Settings.server+'.'+Settings.username+'.'+this.name+'.'+name;
    s.parent = this;
    s.name = name;
    this[name] = def_val;
    s.type = type;
    s.typedata = typedata;
    s.description = description;
    s.hidden = hidden;
    if (parent_el != undefined) s.parent_el = parent_el;
    s.def_val = def_val;
    s.read();
    this.s[name] = s;
    return s;
};
// This adds a given element directly
Feature.direct=function(type, hidden){
    var s = new Object();
    s.__proto__ = Settings;
    s.el = document.createElement(type);
    if (hidden==undefined || typeof(hidden) != 'string') hidden='false';
    s.hidden = hidden;
    
    // Create a new, unique index for it to be stored in
    s.type = type;
    for (var i=0; this.s[s.type+i] != undefined; i++);
    var name = s.type + i;

    // Overwrite the normal functions... we want different behaviour for this guy...
    s.config = function(parent_element){
        while (s.el.childNodes.length > 0) s.el.removeChild(s.el.childNodes[0]);
        parent_element.appendChild(s.el);
    };
    s.read = nothing;
    s.write = nothing;

    this.s[name] = s;
    return s;
};
Feature.create=function(name){
    var x=new Object();
    x.__proto__=Feature;
    x.name = name;
    x.s=new Object();
    Feature.list[name]=x;
    global[name]=x;
    return x;
};
// Executes the function specified by fn_name
// wrapped by a try..catch block and stores
// the start and endtime of execution.
// If (once), this function can't be called
// anymore in the future.
Feature.call=function(fn_name, once) {
    if (once==undefined) once=false;
    if (!this.start) this.start=new Object();
    this.start[fn_name] = new Date().getTime();
    try {
        this[fn_name]();
    } catch (e) {
        Debug.exception("call "+this.name+'.'+fn_name, e);
    }
    if (once) this[fn_name]=nothing;
    if (!this.end) this.end=new Object();
    this.end[fn_name] = new Date().getTime();
    // TODO: make this timing info visible somewhere.
};
// Executes (using Feature.call) the function specified by fn_name for all _enabled_
// Features created with Feature.create() in the order they have been created.
// A feature is enabled if it doesn't have an enabled field or its enabled field is not
// exactly equal to false.
Feature.forall=function(fn_name, once) {
    for (var n in this.list) {
        if (this.list[n].enabled!==false)
            this.list[n].call(fn_name, once);
    }
};

/********************************************
 * SETTINGS - from Travian Timeline (mostly)
 ********************************************/
Feature.create("Settings");
Settings.type = {none: 0, string: 1, integer: 2, enumeration: 3, object: 4, bool: 5};
Settings.server=function(){
    // This should give the server id as used by travian analyzer.
    var url = location.href.match("//([a-zA-Z]+)([0-9]*)\\.travian(?:\\.com?)?\\.(\\w+)/");
    if (!url) return "unknown";
    var a=url[2];
    if (url[1]=='speed') a='x';
    if (url[1]=='speed2') a='y';
    return url[3]+a;
}();
// This has to come after we know what Settings.server is
Settings.username = GM_getValue(Settings.server+'.Settings.username');
// Get the value of this setting.
// Note that (for example)
// "var u = Settings.username;" and "var u = Settings.s.username.get();" have the same effect.
Settings.get=function() {
    return this.parent[this.name];
}

// Set the value of this setting.
// Note that (for example)
// "Settings.username = u;" and "Settings.s.username.set(u);" have the same effect.
Settings.set=function(value) {
    this.parent[this.name]=value;
}

// Retrieves the value from the GM persistent storage database aka about:config
// Settings are not automatically updated.
// Call this if the value might have changed and you want it's latest value.
Settings.read=function() {
    try {
        switch (this.type) {
        case Settings.type.none:
        break;

        case Settings.type.string:
        var x = GM_getValue(this.fullname);
        if (x!==undefined && x!=="")
            this.set(x);
        break;

        case Settings.type.integer:
        case Settings.type.enumeration:
        var x = GM_getValue(this.fullname);
        if (x!==undefined && x!=="")
            this.set(x-0);
        break;

        case Settings.type.object:
        var x = GM_getValue(this.fullname);
        if (x!==undefined && x!=="")
            this.set(eval(x));
        break;

        case Settings.type.bool:
        var x = GM_getValue(this.fullname);
        if (x!==undefined && x!=="")
            this.set(x==true);
        break;
        }
    } catch (e) {
        if (Debug&&Debug.exception)
            Debug.exception("Settings.read", e);
        else
            GM_log("FATAL:"+e);
    }
};

// Stores the value in the GM persistent storage database aka about:config
Settings.write=function() {
    try {
        switch (this.type) {
        case Settings.type.none:
        Debug.warning("This setting ("+this.fullname+") has no type and can't be stored!");
        break;

        case Settings.type.string:
        case Settings.type.integer:
        case Settings.type.enumeration:
        case Settings.type.bool:
        GM_setValue(this.fullname, this.get());
        break;

        case Settings.type.object:
        GM_setValue(this.fullname, uneval(this.get()));
        break;
        }
    } catch (e) {
        if (Debug&&Debug.exception)
            Debug.exception("Settings.read", e);
        else
            GM_log("FATAL:"+e);
    }
};

// Appends a DOM element to parent_element that can be used to modify this setting.
Settings.config=function(parent_element) {
    try {
        var s = document.createElement("span");
        var setting = this;
        var settingsname = this.name.replace(/_/g," ").pad(22);
        var hint="";

        // Add tooltip with a description (if available)
        if (this.description) {
            s.title = this.description;
            var h = this.description.match("\\(([-a-zA-Z0-9.,_ ]+)\\)$");
            if (h)
                hint = " "+h[1];
        }

        // Create the input element.
        switch (this.type) {
        case Settings.type.none: {
            s.innerHTML = settingsname+": "+this.get()+hint+"\n";
            break;
        }

        case Settings.type.string:
        case Settings.type.integer: {
            {
                var input = '<input value="'+this.get()+'"/>';
                s.innerHTML = settingsname+": "+input+hint+"\n";
            }
            s.childNodes[1].addEventListener("change",function (e) {
                    var val=e.target.value;
                    if (setting.type==Settings.type.integer) {
                        if (val=="") val = setting.def_val;
                        else val-=0;
                    }
                    setting.set(val);
                    setting.write();
                    Settings.fill(); // Redraw everything, in case a eval condition has changed
                },false);
            break;
        }

        case Settings.type.enumeration: {
            {
                var select='<select>';
                var j = this.get();
                for (var i in this.typedata) {
                    select+='<option value="'+i+'"';
                    if (i==j) select+='selected="" ';
                    select+='>'+this.typedata[i]+'</option>';
                }
                select+='</select>';
                s.innerHTML = settingsname+": "+select+hint+"\n";
            }
            s.childNodes[1].addEventListener("change",function (e) {
                    var val=e.target.value-0;
                    setting.set(val);
                    setting.write();
                    Settings.fill(); // Redraw everything
                },false);
            break;
        }
        
        case Settings.type.object: {
            // TODO: have some more info for this object in some special cases.
            s.innerHTML = settingsname+": (Object)"+hint+"\n";
            break;
        }
        
        case Settings.type.bool: {
            s.style.cursor = "pointer";
            s.style.color = this.get()?'green':'red';
            s.innerHTML = settingsname+": <u>"+this.get()+"</u>"+hint+"\n";
            s.addEventListener("click",function (e) {
                    var val=!setting.get();
                    s.style.color = val?'green':'red';
                    s.childNodes[1].innerHTML = val;
                    setting.set(val);
                    setting.write();
                    Settings.fill(); // Redraw everything
                },false);
            break;
        }
        }
        // Insert the element.
        if (setting.parent_el){ // If we have an expressed parent element
            if (setting.parent_el.type == 'table'){ // create the tr's and td's
                var tr = document.createElement('tr');
                var td = document.createElement('td');
                td.appendChild(s);
                tr.appendChild(td);
                setting.parent_el.el.appendChild(tr);
            } else setting.parent_el.el.appendChild(s);
        } else parent_element.appendChild(s); // Default if we have no given parent
    } catch (e) {
        GM_log(e);
    }
};
Settings.setting("current_tab",  "Settings",Settings.type.string,      undefined, '', 'true');
Settings.setting("time_format",  0,         Settings.type.enumeration, ['Euro (dd.mm.yy 24h)', 'US (mm/dd/yy 12h)', 'UK (dd/mm/yy 12h', 'ISO (yy/mm/dd 24h)']);
Settings.run=function() {
    // First, test to see if this is the login page. If it is, extract the login name and prefix it to all variables
    if (location.href.indexOf('/login.php') > 0){
        var login = xpath('//input[(@class="fm fm110") and (@type="text")]', XPathResult.ANY_UNORDERED_NODE_TYPE).singleNodeValue;
        var name = login.value;
        if (name == undefined) name = 'someone';
        GM_setValue(Settings.server+'.Settings.username', name);
        login.addEventListener('change', function(e){
                var name = e.target.value.toLowerCase();
                if (name == undefined) return;
                // We have to do this the manual way, because we can't figure out the namespace to extract username from until we know the username...
                GM_setValue(Settings.server+'.Settings.username', name);
            }, false);
        return;
    } else if (location.href.indexOf('/spieler.php') > 0) return;

    GM_log('hi');
    Debug.debug('hi');
    // Place the image to open up the settings menu
    var x = document.getElementsByName('msg')[0].childNodes[0].childNodes[0].childNodes[0].childNodes[0];
    x.innerHTML = '<img src="'+Image['setup']+'">';
    return;

    // Create link for opening the settings menu.
    var div = document.createElement("div");
    div.style.position = "absolute";
    div.style.zIndex   = "2";
    var right = Timeline.width;
    if (Timeline.collapse) right = Timeline.collapse_width;
    if (!Timeline.enabled) right = 0;
    right+=5;
    div.style.right           = right+"px";
    div.style.top             = "-5px";
    div.style.MozBorderRadius = "6px";
    div.style.padding         = "3px";
    div.style.border          = "1px solid #999";
    div.style.background      = "#ccc";
    div.innerHTML = "<a href=\"#\" style=\"color: blue; font-size: 12px;\">Travian Time Line Settings</a>";
    document.body.appendChild(div);
    var link = div.firstChild;
    link.style.cursor="pointer";
    link.addEventListener("click",Settings.show,false);

    // Extract the active village
    // These values below are sufficient to keep things working when only 1 village exists.
    Settings.village_name = "";
    Settings.village_id = 0;
    try {
        var village_link = document.evaluate('//a[@class="active_vl"]', document, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
        Settings.village_name = village_link.textContent;
        Settings.village_id=village_link.href.match("newdid=(\\d+)")[1]-0;
    } catch (e) {
        // If this fails, there probably is only 1 village.
        // Having the name in the timeline isn't really usefull then.
    }
    Debug.debug("The active village is "+Settings.village_id+": "+Settings.village_name);
    Settings.village_names[Settings.village_id]=Settings.village_name;
    Settings.s.village_names.write();
};
Settings.show=function() {
    var w = document.createElement("div");
    w.style.position = "fixed";
    w.style.zIndex   = "250";
    w.style.left     = "0px";
    w.style.top      = "0px";
    w.style.right    = "0px";
    w.style.bottom   = "0px";
    w.style.background = "rgba(192,192,192,0.8)";
    w.innerHTML = '<div style="position: absolute; left: 0px; right: 0px; top: 0px; bottom: 0px; cursor: pointer;"></div>'+
                  '<div style="position: absolute; left: 50%; top: 50%;">'+
                  '<pre style="position: absolute; left: -300px; top: -250px; width: 600px; height: 400px;'+
                  ' border: 3px solid #000; background: #fff; overflow: auto; padding: 8px;'+
                  ' -moz-border-radius-topleft:12px; -moz-border-radius-topright:12px;">'+
                  '</pre></div>';
    document.body.appendChild(w);
    Settings.window = w;
    try {
        var p = w.childNodes[1];
        function add_el(type) {
            var el=document.createElement(type);
            p.appendChild(el);
            return el;
        }

        // First we need to create the tabs...
        var txt = '<tbody>';
        for (var n in Feature.list){
            var f = Feature.list[n];
            if (f.s == undefined) continue;

            txt += '<tr align="right"><td style="padding: 5px 0px;"><a href="#" style="-moz-border-radius-topleft:8px; -moz-border-radius-bottomleft:8px;'+
                'padding:2px 11px 3px; border: 2px solid #000; '+
                (n==Settings.current_tab?'background: #fff; border-right: none;':'background: #ddd; border-right: 3px solid black;')+
                ' color:black; outline: none;">'+
                f.name + '</a></td></tr>';
        }
        txt += '</tbody>';

        // Then we need to create the tab bar, to switch between tabs
        var tabbar = add_el('table');
        tabbar.innerHTML = txt;
        tabbar.style.position="absolute";
        tabbar.style.width = "150px";
        tabbar.style.left  = "-445px";
        tabbar.style.top   = "-200px";

        Settings.fill();
        
        var notice = add_el('pre'); // Add the copyright
        notice.innerHTML="Copyright (C) 2008, 2009 Bauke Conijn, Adriaan Tichler\n"+
            "GNU General Public License as published by the Free Software Foundation;\n"+
            "either version 3 of the License, or (at your option) any later version.\n"+
            "This program comes with ABSOLUTELY NO WARRANTY!";
        notice.style.color="#666";
        notice.style.fontStyle="italic";
        notice.style.fontSize="75%";
        notice.style.textAlign="center";
        notice.style.position="absolute";
        notice.style.left="-300px";
        notice.style.top="180px";
        notice.style.width="600px";
        notice.style.padding="1px 8px";
        notice.style.border="3px solid #000";
        notice.style.background="#fff";
        notice.style.MozBorderRadiusBottomleft ="12px";
        notice.style.MozBorderRadiusBottomright="12px";

        // Add click listeners to all of the tab buttons
        var tabs=tabbar.childNodes[0].childNodes;
        for (var n in tabs){
            var a = tabs[n].childNodes[0].childNodes[0];
            a.addEventListener('click', function(e){
                var el = e.target;
                var f = Feature.list[el.textContent];
                Settings.current_tab=el.textContent;
                Settings.s.current_tab.write();

                // Reset the background colours of *all* tab buttons
                for (var i in tabs){
                    tabs[i].childNodes[0].childNodes[0].style.background = "#ddd";
                    tabs[i].childNodes[0].childNodes[0].style.borderRight = "3px solid black";
                }

                el.style.background = "#fff"; // Turn the colour of the clicked element white
                el.style.borderRight = "none"; // Simulate that the tab is connected to the settings page

                Settings.fill();
            }, false);
        }
    } catch (e) {
        Debug.exception("Settings.show", e);
    }
    w.firstChild.addEventListener("click",Settings.close,false);
};

// This fills/refreshes the display portion of the settings table
Settings.fill=function(){
    var disp = Settings.window.childNodes[1].childNodes[0];
    var f = Feature.list[Settings.current_tab];
    if (f){
        disp.innerHTML = '';
        for (var i in f.s){ // And refill it
            if (eval(f.s[i].hidden)) continue; // Ignore hidden elements
            f.s[i].read();
            f.s[i].config(disp);
        }
    }
}

Settings.close=function(){
    remove(Settings.window);
};


/****************************************
 * DEBUG - from Travian Timeline
 ****************************************/
Feature.create("Debug");
// These categories are in order from extremely severe to extremely verbose and
// are converted to functions in the Debug namespace using the specified name.
// Example: Debug.warning("This shouldn't have happend!");
// Using the index is also allowed: Debug[1]("This shouldn't have happend!");
// has the same effect as the previous example.
Debug.categories=["none","fatal","error","warning","info","debug","all"];
Debug.methods=["console","firebug"];
Debug.setting("level", 0, Settings.type.enumeration, Debug.categories, "Which categories of messages should be sent to the console. (Listed in descending order of severity).");
Debug.setting("output", 0, Settings.type.enumeration, Debug.methods, "Where should the debug output be send to.");
Debug.print =GM_log;
Debug.lineshift = function(){
    try { p.p.p=p.p.p; } catch (e) { return e.lineNumber-577; } // Keep the number in this line equal to it's line number. Don't modify anything else.
}();
Debug.exception=function(fn_name, e) {
    // The lineshift is to correct the linenumber shift caused by greasemonkey.
    var msg = fn_name+' ('+(e.lineNumber-Debug.lineshift)+'): '+e;
    try {
        Debug.error(msg);
    } catch (ee) {
        GM_log(msg);
    }
};
Debug.init =function() {
    switch (Debug.output) {
    case 0:
    for (var i in Debug.categories) {
        Debug[i]=Debug[Debug.categories[i]]=(i <= this.level)?this.print:nothing;
    }
    break;
    case 1:
    var console = unsafeWindow.console;
    if (!console) {
        Debug.print("Firebug not found! Using console for this page!");
        Debug.output=0;
        Debug.init();
        return;
    }
    var fns=[console.error,console.error,console.error,console.warn,console.info,console.debug,console.debug];
    for (var i in Debug.categories) {
        Debug[i]=Debug[Debug.categories[i]]=(i <= this.level)?fns[i]:nothing;
    }
    break;
    }
};
Debug.call("init",true); // Runs init once.
Debug.info("Running on server: "+Settings.server);


Feature.forall('init', true);
window.addEventListener('load', function(){ Feature.forall('run', true);}, false);