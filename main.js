function removeNode (el) {
  // Mimics $.remove() which is not supported in IE7 - only works for single nodes
  el.parentNode.removeChild(el);
}

function getTextNodesIn(el) {
  // Gets all text nodes in an element
  "use strict";
  return $(el).find(":not(iframe)").addBack().contents().filter(function () {
    return this.nodeType === 3;
  });
}

function insertNewlines(html) {
  "use strict";
  // Remove "empty" textnodes (identified by leadin \n)
  var textnodes = getTextNodesIn(html);
  textnodes.each(function(index, el) {
    // Skip if text node is deliberate "&nbsp;"
    if (!(el.data == String.fromCharCode(160))) {
      // if not deliberate &nbsp, test if it contains only whitespace
      if ( (/(\r)?\n+\s*/.test(el.data))  || /^[\t\r\n\s]*$/.test(el.data)) {
        removeNode(el);
      }
    }
  });

  var text = "";
  walkTheDOM(html, function (node) {
    // Text nodes
    if (node.nodeType === 3) {
      if (/indentname/.test(node.parentNode.className) && node === node.parentNode.firstChild) {text += "                                             " + node.data;}
      else if (/indent/.test(node.parentNode.className) && node === node.parentNode.firstChild) {text += "                               " + node.data;}
      else {text += node.data;}
      if (isNextSiblingBlock(node)) {
        text += '\r\n';
      }
    }
    // Element nodes (the rest)
    else if (node.nodeType === 1 && node.nodeName == 'SPAN') {
      if (isNextSiblingBlock(node)) {
        text += '\r\n';
      }
    }
    else if (node.nodeType === 1 && node.nodeName == 'B') {
      if (node.nextSibling !== null && node.nextSibling.nodeType === 1) {
        text += '\r\n';
      }
    }
    else if (node.nodeType === 1 && node.nodeName == 'P') {
      if (node.nextSibling !== null && node.nextSibling.nodeType === 1) {
        text += '\r\n';
      }
    }
    else if (node.nodeType === 1 && node.nodeName == 'DIV') {
      if (node.nextSibling !== null && node.nextSibling.nodeType === 1) {
        if (/singlebreakafterthis/.test(node.className)) {
          text += '\r\n';
        } else if (/doublebreakafterthis/.test(node.className)) {
          text += '\r\n\r\n';
        } else if (node.nextSibling !== null && node.nextSibling.nodeType === 1) {
        text += '\r\n';
        }
      }
    }
  });

  return text;
}

function htmlToText($html) {
  // Main function
  "use strict";
  var text = insertNewlines($html[0]);
  return text;
}

function walkTheDOM(node, func) {
  // Recursive function that traverses the dom, depth-first,
  // calling func on each element in the order they are traversed
  "use strict";
  var old_node = node;
  var local_node = node.firstChild;
  while (local_node) {
      walkTheDOM(local_node, func);
    local_node = local_node.nextSibling;
  }
  func(old_node);
}

function isNextSiblingBlock (_node_) {
  if (
      _node_.nextSibling !== null &&
      _node_.nextSibling.nodeType === 1 &&
      (
        _node_.nextSibling.nodeName == "B" ||
        _node_.nextSibling.nodeName == "P" ||
        _node_.nextSibling.nodeName == "DIV"
      )
    ) {
      return true;
  } else {
      return false;
  }
}

// Acknowledgement to Upshots
// http://upshots.org/javascript/jquery-copy-style-copycss
$.fn.copyCSS = function(source){
  var dom = $(source).get(0);
  var style;
  var dest = {};
  if(window.getComputedStyle){
      var camelize = function(a,b){
          return b.toUpperCase();
      };
      style = window.getComputedStyle(dom, null);
      for(var i = 0, l = style.length; i < l; i++){
          var prop = style[i];
          var camel = prop.replace(/\-([a-z])/g, camelize);
          var val = style.getPropertyValue(prop);
          dest[camel] = val;
      }
      return this.css(dest);
  }
  if(style = dom.currentStyle){
      for(var prop in style){
          dest[prop] = style[prop];
      }
      return this.css(dest);
  }
  if(style = dom.style){
    for(var prop in style){
      if(typeof style[prop] != 'function'){
        dest[prop] = style[prop];
      }
    }
  }
  return this.css(dest);
};


(function() {
    var interval;

      jQuery.fn.contentchange = function(fn) {
          return this.bind('contentchange', fn);
      };

      jQuery.event.special.contentchange = {
          setup: function(data, namespaces) {
              var self = this,
                  $this = $(this),
                  $originalContent = $this.text();
              interval = setInterval(function(){
                  if($originalContent != $this.text()) {
                          $originalContent = $this.text();
                          jQuery.event.special.contentchange.handler.call(self);
                  }
              },500);
          },
          teardown: function(namespaces){
              clearInterval(interval);
          },
          handler: function(event) {
              jQuery.event.dispatch.call(this, {type:'contentchange'});
          }
      };
  })();


// events object for subscribe/publish pattern
var events = (function(){
  var topics = {};
  var hOP = topics.hasOwnProperty;

  return {
    subscribe: function(topic, listener) {
      // Create the topic's object if not yet created
      if(!hOP.call(topics, topic)) topics[topic] = [];

      // Add the listener to queue
      var index = topics[topic].push(listener) -1;

      // Provide handle back for removal of topic
      return {
        remove: function() {
          delete topics[topic][index];
        }
      };
    },
    publish: function(topic, info) {
      // If the topic doesn't exist, or there's no listeners in queue, just leave
      if(!hOP.call(topics, topic)) return;

      // Cycle through topics queue, fire!
      topics[topic].forEach(function(item) {
          item(info !== undefined ? info : {});
      });
    }
  };
})();
