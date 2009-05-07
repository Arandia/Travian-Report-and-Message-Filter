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
// @exclude        http://forum.travian*.*
// @exclude        http://board.travian*.*
// @exclude        http://shop.travian*.*
// @exclude        http://help.travian*.*
// @exclude        http://*.travian*.*/manual.php*
// ==/UserScript==

/**************************************************************************************
 * Copyright 2008, 2009 Adriaan Tichler
 * Some parts from Travian Timeline, copyright Bauke Conijn, Adriaan Tichler
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
Trans = {};

// For creating/using global variables from local scope
var global = this;

function nothing(){};
function xpath(search, type){
    return document.evaluate(search, document, null, type, null);
};

/********************************************************
 * This is the subclass for everything
 ********************************************************/
Feature = new Object();
Feature.list = [];
Feature.setting = function(name, def_val){
    var s = new Object();
    s.__proto__ = Settings;
    s.fullname = Settings.server+'.'+Settings.uid+'.'+this.name+'.'+name;
    s.name = name;
    s.parent = this;
    this[name] = def_val;
    s.def_val = def_val;
    s.read();
    return s;
};

Feature.create = function(name){
    var x = new Object();
    x.__proto__ = Feature; // Create a subclass
    x.name = name;
    x.s = new Object();
    Feature.list[name] = x;
    global[name] = x;
};

/********************************************************
 * This deals with saving/loading saved values, and with
 * adding the options interface to the user.
 ********************************************************/
Feature.create("Settings");
Settings.read = function(){
    var x = GM_getValue(this.fullname, this.def_val);
    if (x === '') return;
    switch (typeof(this.def_val)){
    case 'bool':
        this.parent[this.name] = (x==true);
        break;
    case 'string':
        this.parent[this.name] = x;
        break;
    case 'int':
        this.parent[this.name] = x-0;
        break;
    }
};

Settings.write = function(){
    // This loads everything from the persistent data
    GM_setValue(this.fullname, this.parent[this.name]);
};

Messages = new Object();
Reports = new Object();

