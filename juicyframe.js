/**
 * YOnote(tm) JuicyFrame(tm)
 * 
 * A javascript-based framework
 * 
 * @author Vlad Gramuzov <pandomic@gmail.com>
 * @copyright 2012 YOnote(tm) JuicyFrame(tm)
 * @license
 */

(function(){

    /////////////////////////////////////////
    //          PRIVATE VARIABLES          //
    /////////////////////////////////////////

    var cache = [];
    var pseudos = [];
    var animPresets = [];
    var useCache = true;
    var useNative = true;
    var globalAnimationStop = false;
    var nullObject = document.createElement('span');
        nullObject.style['display'] = 'none';
        var readyCallbacks = new Array();
        var readyCalled = false;
    
    /////////////////////////////////////////
    //          AUXILIARY FUNCTIONS        //
    /////////////////////////////////////////
        
    function protoseach(arr,callback){
        var arrLen = arr.length;
        for (var i = 0; i < arrLen; i++){
            callback.call(arr[i],i,arr[i]);
        }
    }
        
    function protosparent(node){
        node = node.parentNode;
        while (node && node.nodeType != 1){
            node = node.previousSibling;
        }
        return node;
    }
    
    function protoscomputedStyle(elem){
        if (typeof window.getComputedStyle == 'function'){
            return getComputedStyle(elem,null);
        } else {
            return elem.currentStyle;
        }
    }
	
	function protosmakeEaseOut(func,progress){
		return 1-func.apply(1-progress);
	}
	
	function protosmakeEaseInOut(func,progress) {  
		if (progress < 0.5){
		    return func.apply(2*progress) / 2;
		} else {
		    return (2-func.apply(2*(1-progress)))/2;
		}
	}
    
    function protosanimate(object,params,duration,type,callback){

        if (typeof object != 'object'){return false;}

        var param;
        var animParams = [];
        
        var regType = /(\+=|-=)/i;
        var regGlob = /(-?[0-9.]+)(.+)?/i;
        
        var currentParams = [];
        var currentTypes = [];
        
        var interval;
        var intervalSteps = 0;
        var animProgress;
        var animProps;
        var oldValue;
        var animType;
        
        if (object.animating == true){
            window.setTimeout(function(){
                if (object.animating == true){
                    window.setTimeout(arguments.callee,10);
                } else {
                    innerAnimate();
                }
            },10)
        } else {
            innerAnimate();
        }
                
        
        
        function innerAnimate(){
                    
            var animationStart = new Date().getTime();
            globalAnimationStop = false;
            object.stopAnim = false;
            object.animating = true;
            
            for (var param in params){
			
                animParams[param] = {}

                currentTypes = params[param].match(regType);
                currentParams = params[param].match(regGlob);

                oldValue = protoscomputedStyle(object);
                animParams[param].old = parseFloat(oldValue[param]);

                if (currentTypes != null && currentTypes[1].indexOf('+=') != -1){
                    animParams[param].type = 'inc';
                    animParams[param].value = animParams[param].old + currentParams[1];
                } else if (currentTypes != null && currentTypes[1].indexOf('-=') != -1){
                    animParams[param].type = 'dec';
                    animParams[param].value = animParams[param].old - currentParams[1];
                } else {
                    animParams[param].type = 'def';
                    animParams[param].value = currentParams[1];
                }


                animParams[param].units = '';



                if (typeof currentParams[2] != 'undefined'){
                    animParams[param].units = currentParams[2];
                }
            
            }
                    
            window.setTimeout(function(){

                animProgress = (new Date().getTime() - animationStart)/duration;

                for (var param in animParams){

                    if (typeof animPresets[type] != 'undefined'){
                        animType = animPresets[type].call(animProgress,animProgress);
                    } else {
                        animType = animProgress;
                    }

                    animProps = (animParams[param].value - animParams[param].old) * animType + animParams[param].old;
                    JF(object).css(param,animProps + animParams[param].units);

                }

                if (animProgress < 1 && object.stopAnim != true && globalAnimationStop != true){
                    window.setTimeout(arguments.callee,10);
                } else if (object.stopAnim == true || globalAnimationStop == true) {
                    object.animating = false;
                    if (typeof callback != 'undefined'){
                        callback.call(object,object);
                    }
                    return;

                } else {
                    
                    object.animating = false;
                    for (var param in animParams){
                        JF(object).css(param,animParams[param].value + animParams[param].units);
                    }

                    if (typeof callback != 'undefined'){
                        callback.call(object,object);
                    }

                    
                    return;
                }
            
            
            },10);
                    
        }
                
    }
        
    function protosieEventFix(evnt){
    
        evnt = evnt || window.event;
        
        if (evnt.pageX == null && evnt.clientX != null){
        
            var html = document.documentElement;
            var body = document.body;
        
            evnt.pageX = evnt.clientX + (html && html.scrollLeft || body && body.scrollLeft || 0) - (html.clientLeft || 0);
            evnt.pageY = evnt.clientY + (html && html.scrollTop || body && body.scrollTop || 0) - (html.clientTop || 0);
        }

        if (!evnt.which && evnt.button){
            evnt.which = (evnt.button < 2) ? 1 : ( (event == 4) ? 2 : 3 );
        }

        return  evnt;
    }
        
    function protosattachEvent(object,event,handler){

        if (typeof object['callbacks'] == 'undefined'){
            object['callbacks'] = [];
        }
        
        if (typeof object['callSets'] == 'undefined'){
            object['callSets'] = [];
        }
        
        object['callbacks'].push(handler);
        
        var thisCallback = function(event){
            event = protosieEventFix(event);
            handler.call(object,event);
        }
        
        object['callSets'].push(thisCallback);
        
        if (typeof addEventListener == 'function'){    
            object.addEventListener(event,thisCallback,false);
        } else if (typeof attachEvent == 'function') {
            object.attachEvent(event,thisCallback);
        } else if (typeof addEvent == 'function'){
            addEvent(object,event,thisCallback);
        } else {
            object['on' + event] = thisCallback;
        }
    }
        
    function protosnodeTrans(nodeList){
        var result = new Array();
        var nodeLen = nodeList.length;
        for (var i = 0; i < nodeLen; i++){
            result[i] = nodeList[i];
        }
        return result;
    }
        
    function protostrim(str){
        return str.replace(/(^\s+|\s+$)/g,'');
    }
        
    function protosinArray(array,value){
        var arrLength = array.length;
        for (var i = 0; i < arrLength; i++ ){
            if (array[i] == value){
                return true;
            }
        }
        return false;
    }
        
    function protosclassCheck(objClass,allowedClasses){
    
        var spaceReplacer = /\s+/g;
        var objClasses = new Array();
        var classStrings = new Array();
        var objClassLen;
        var checkCounter;
       
        objClass = objClass.replace(spaceReplacer,' ');
        objClasses = objClass.split(' ');
        allowedClassesLen = allowedClasses.length;
        objClassLen = objClasses.length;
        
        if (allowedClassesLen == 1){
            if (protosinArray(objClasses,allowedClasses[0])){
                return true;
            }
        } else if (allowedClassesLen > 0){
            checkCounter = 0;
            for (var i = 0; i < objClassLen; i++){
                if (protosinArray(allowedClasses,objClasses[i])){
                    checkCounter++;
                }
                
            }
            if (checkCounter == allowedClassesLen){
                return true;
            }
        }
        return false;
    }
        
    function protospseudoPrepare(results,pseudo,attrs,attrsLen){
    
        //return results;
    
        var res = [];
        var result = [];
        var currAttrs = [];
        var attrMatch = /^\[[a-zA-Z0-9_\-]+="[a-zA-Z0-9\-_.]+"\]$/g;
        var attrSpaces = /^\[[a-zA-Z0-9_\-]+&="[a-zA-Z0-9\-_.]+"\]$/g;
        var attrDef = /^\[[a-zA-Z0-9_\-]+\|="[a-zA-Z0-9\-_.]+"\]$/g;
        var attrStart = /^\[[a-zA-Z0-9_\-]+\^="[a-zA-Z0-9\-_.]+"\]$/g;
        var attrEnd = /^\[[a-zA-Z0-9_\-]+\$="[a-zA-Z0-9\-_.]+"\]$/g;
        var attrCon = /^\[[a-zA-Z0-9_\-]+\*="[a-zA-Z0-9\-_.]+"\]$/g;
        var attrSingle = /^\[[a-zA-Z0-9_\-]+\]$/g;
        var attrRegex = /^\[([a-zA-Z0-9_\-]+)(.+)?\]$/i;
        var attrValRegex = /^\[[a-zA-Z0-9_\-]+&?\*?\$?\^?\|?="([a-zA-Z0-9\-_.]+)"\]$/i;
        
        var attrName;
        var attrValue;
        var currAttr;
        var resultLen;
        var currAttrsLen;
        var attrCheck;
            
        if (typeof pseudos[pseudo] != 'undefined'){
            res = pseudos[pseudo](results);
        } else {
            res = results;
        }
            
        if (attrsLen == 0){
            return res;
        } else {
            
            result = results;
            res = [];
            
            
            
            for (var i = 0; i < attrsLen; i++){
                
                attrName = attrs[i].match(attrRegex)[1];
                attrName = attrName.toLowerCase();
                
                if (attrValRegex.test(attrs[i])){
                    attrValue = attrs[i].match(attrValRegex)[1];
                    attrValue = attrValue.toLowerCase();
                } else {
                    attrValue = '';
                }

                resultLen = result.length;
                res = [];

                // [attr="value"]
                if (attrs[i].search(attrMatch) != -1){
                    for (var j = 0; j < resultLen; j++){
                        currAttr = result[j].getAttribute(attrName);
                        if (typeof currAttr == 'string'){
                            currAttr = currAttr.toLowerCase();
                        } else {
                            currAttr = '';
                        }
                        if (currAttr == attrValue){
                            
                            res.push(result[j]);
                        }
    
                    }
                    result = res;
                    continue;
                }
                
                // [attr~="value"]
                if (attrs[i].search(attrSpaces) != -1){
                    for (var j = 0; j < resultLen; j++){
                        currAttr = result[j].getAttribute(attrName);
                        if (typeof currAttr == 'string'){
                            currAttr = currAttr.toLowerCase();
                        } else {
                            currAttr = '';
                        }
                        
                        currAttrs = currAttr.split(' ');
                        currAttrsLen = currAttrs.length;
                        
                        for (z = 0; z < currAttrsLen; z++){
                                
                            if (protostrim(currAttrs[z]) == attrValue){
                                res.push(result[j]);
                            }
                                
                        }
    
                    }
                    result = res;
                    continue;
                }
                    
                // [attr|="value"]
                if (attrs[i].search(attrDef) != -1){
                    for (var j = 0; j < resultLen; j++){
                        currAttr = result[j].getAttribute(attrName);
                        if (typeof currAttr == 'string'){
                            currAttr = currAttr.toLowerCase();
                        } else {
                            currAttr = '';
                        }
                        
                        currAttrs = currAttr.split('-');
                        currAttrsLen = currAttrs.length;
                            
                        for (z = 0; z < currAttrsLen; z++){
                            
                            if (protostrim(currAttrs[z]) == attrValue){
                                res.push(result[j]);
                            }
                                
                        }
    
                    }
                    result = res;
                    continue;
                }
                    
                // [attr^="value"]
                if (attrs[i].search(attrStart) != -1){
                    for (var j = 0; j < resultLen; j++){
                        currAttr = result[j].getAttribute(attrName);
                        if (typeof currAttr == 'string'){
                            currAttr = currAttr.toLowerCase();
                        } else {
                            currAttr = '';
                        }
                            
                        attrCheck = new RegExp('^' + attrValue,'g');
                        if (currAttr.search(attrCheck) != -1){
                            res.push(result[j]);
                        }    
    
                    }
                    result = res;
                    continue;
                }
                
                // [attr$="value"]
                if (attrs[i].search(attrEnd) != -1){
                    for (var j = 0; j < resultLen; j++){
                        currAttr = result[j].getAttribute(attrName);
                        if (typeof currAttr == 'string'){
                            currAttr = currAttr.toLowerCase();
                        } else {
                            currAttr = '';
                        }
                            
                        attrCheck = new RegExp(attrValue + '$','g');
                        if (currAttr.search(attrCheck) != -1){
                            res.push(result[j]);
                        }
    
                    }
                    result = res;
                    continue;
                }
                
                // [attr*="value"]
                if (attrs[i].search(attrCon) != -1){
                    for (var j = 0; j < resultLen; j++){
                        currAttr = result[j].getAttribute(attrName);
                        if (typeof currAttr == 'string'){
                            currAttr = currAttr.toLowerCase();
                        } else {
                            currAttr = '';
                        }
                            
                        attrCheck = new RegExp(attrValue,'g');
                        if (currAttr.search(attrCheck) != -1){
                            res.push(result[j]);
                        }
    
                    }
                    result = res;
                    continue;
                }
               
                // [attr]
                if (attrs[i].search(attrSingle) != -1){
                    
                    for (var j = 0; j < resultLen; j++){
                        attrName = attrs[i].replace(/\[|\]/g,'');
                        
                        if (result[j].hasAttribute(attrName)){
                            res.push(result[j]);
                        }
    
                    }
                    result = res;
                    continue;
                }
                
            }
            return result;
            
        }
    }
        
    function protosfixClass(obj){
        if (typeof obj.className != 'undefined' && !obj.getAttribute('class')){
            obj.setAttribute('class',obj.className);
        } else if (typeof obj.className != 'undefined' && typeof obj.getAttribute('class') != 'undefined'){
            obj.setAttribute('className',obj['class']);
        }
    }
    
    function protosobjSearch(selector,context){
        
        var divElems = [];
        var results = [];
        var elems = [];
        var classes = [];
        var contextLen = context.length;
        var attrSelectors = [];
        var attrSelectorsLen = 0;
        var elemsLen;
        var divElemsLen;
        var classesLen;
        var checkClass;
        var pseudoClass;
            
        var patTagOnly = /^[a-zA-Z0-9\-_]+$/g;
        var patTagToClass = /^[a-zA-Z0-9\-_]+(\.[a-zA-Z0-9\-_]+)+$/g;
        var patClassToClass = /^(\.[a-zA-Z0-9\-_]+)+$/g;
        var patIdOnly = /^#[a-zA-Z0-9\-_]+$/g;
        var patTagToId = /^[a-zA-Z0-9\-_]+#[a-zA-Z0-9\-_]+$/g;
        var patEveryTags = /^\*$/g;
    
        if (selector.search(/:/g) != -1){
            pseudoClass = selector.match(/:[a-zA-Z0-9\-_()]+$/g);
            selector = protostrim(selector.replace(pseudoClass,''));
        } else {
            pseudoClass = '';
        }
        
        if (selector.search(/\[/g) != -1){
            attrSelectors = selector.match(/\[[a-zA-Z0-9_\-]+&?\*?\$?\^?\|?=?"?[a-zA-Z0-9\-_.]{0,}"?\]/g);
            attrSelectorsLen = attrSelectors.length;
            selector = selector.replace(attrSelectors.join(''),'');
            //selector = (selector == '' || selector == null) ? '*' : selector;
        }
            
        var isPatTagOnly = patTagOnly.test(selector);
        var isPatTagToClass = patTagToClass.test(selector);
        var isPatClassToClass = patClassToClass.test(selector);
        var isPatIdOnly = patIdOnly.test(selector);
        var isPatTagToId = patTagToId.test(selector);
        var isPatEveryTagsOnly = patEveryTags.test(selector);
            
            
            
        if (isPatTagOnly){
            for (var i = 0; i < contextLen; i++){
                results = results.concat(protosnodeTrans(context[i].getElementsByTagName(selector)));
            }
            return protospseudoPrepare(results,pseudoClass,attrSelectors,attrSelectorsLen);
        }
        
        if (isPatIdOnly){
            for (var i = 0; i < contextLen; i++){
                results.push(context[i].getElementById(selector.substr(1)));
            }
            return protospseudoPrepare(results,pseudoClass,attrSelectors,attrSelectorsLen);
        }
            
        if (isPatTagToId){
            divElems = selector.split('#');
            
            for (var i = 0; i < contextLen; i++){
                
                elems = context[i].getElementsByTagName(divElems[0]);
                elemsLen = elems.length;
                    
                for (var j = 0; j < elemsLen; j++){
                    if (elems[j].id == divElems[1]){
                        results.push(elems[j]);
                    }
                }
                
            }
            return protospseudoPrepare(results,pseudoClass,attrSelectors,attrSelectorsLen);
        }
            
        if (isPatEveryTagsOnly){
            for (var i = 0; i < contextLen; i++){
                results = results.concat(protosnodeTrans(context[i].getElementsByTagName('*')));
            }
            return protospseudoPrepare(results,pseudoClass,attrSelectors,attrSelectorsLen);
        }
            
        if (isPatTagToClass || isPatClassToClass){
            for (var i = 0; i < contextLen; i++){
            
                classes = selector.split('.');
                if (isPatTagToClass){
                    divElems = context[i].getElementsByTagName(classes[0]);
                } else if (isPatClassToClass){
                    divElems = context[i].getElementsByTagName('*');
                }
                classes = classes.slice(1);
                divElemsLen = divElems.length;
                
                for (var j = 0; j < divElemsLen; j++){
                    checkClass = divElems[j].className;
                    if (protosclassCheck(checkClass,classes) == true){
                        results.push(divElems[j]);
                    }
                }
            }
    
            return protospseudoPrepare(results,pseudoClass,attrSelectors,attrSelectorsLen);
        }
    
    }
    
    function protosajax(conf){
            
            /*conf = {
                'method' : 'POST',
                'timeout' : 4000,
                'type' : 'html',
                'url' : 'http://',
                'data' : 'dddd',
                'synch' : false,
                'cache' : false,
                'errorHandler' : 'func',
                'successHandler' : 'func'
            }*/
            
            var postMethod;
            var postTimeout;
            var postResponseType;
            var postURL;
            var postData;
            var postSynch;
            var postUseCache;
            
            if (typeof conf.method != 'undefined'){
                postMethod = conf.method;
            } else {
                postMethod = 'POST';
            }
            
            if (typeof conf.timeout != 'undefined'){
                postTimeout = conf.timeout;
            } else {
                postTimeout = 4000;
            }
            
            if (typeof conf.type != 'undefined'){
                postResponseType = conf.type;
            } else {
                postResponseType = 'html';
            }
            
            if (typeof conf.url != 'undefined'){
                postURL = conf.url;
            } else {
                postURL = '';
            }
            
            if (typeof conf.data != 'undefined'){
                postData = conf.data;
            } else {
                postData = '';
            }
            
            if (conf.synch == true){
                postSynch = true;
            } else {
                postSynch = false;
            }
            
            if (conf.cache == true){
                postUseCache = true;
            } else {
                postUseCache = false;
            }
            
            
            
        var httpRequest;
        var retObj = {};
        var checkTimeOut;
        var dataLine;
        var iterTime = 0;
        
        if (window.XMLHttpRequest){
                    httpRequest = new XMLHttpRequest();
        } else if (window.ActiveXObject){
                    try {
                        httpRequest = new ActiveXObject('Msxml2.XMLHTTP');
                    } catch(e){
                        try {
                            httpRequest = new ActiveXObject('Microsoft.XMLHTTP');
            } catch(e) {}
                    }
        }
        
        if (!httpRequest){
                    if (typeof conf.errorHandler == 'function'){
                        conf.errorHandler.call('httprequest');
                    }
            return;
        }
        
        
        if (typeof postData == 'string'){
                    dataLine = postData;
        } else if (typeof postData == 'object'){
                    dataLine = [];
                    for (var obj in postData){
                        dataLine.push(obj + '=' + postData[obj]);
                    }
                    dataLine = dataLine.join('&');
        }
                
                if (postUseCache == false){
                    postURL += '?ajaxnocache=' + (Math.random() * (9999 - 1000) + 1000);
                }
        httpRequest.open(postMethod,postURL,postSynch);
                httpRequest.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        httpRequest.send(dataLine);
            
        checkTimeOut = window.setTimeout(function(){
        
            iterTime += 10;
        
            if (iterTime >= postTimeout){
                            if (typeof conf.errorHandler == 'function'){
                                conf.errorHandler.call('timeout');
                            }
                            return;
            }
        
            if (httpRequest.readyState == 4){

                if (httpRequest.status != 200){
                                    if (typeof conf.errorHandler == 'function'){
                                        conf.errorHandler.call('response');
                                    }
                                    return;
                }
                
                retObj.status = httpRequest.status;
                
                if (postResponseType == 'xml'){
                    retObj.xml = httpRequest.responseXML;
                } else if (postResponseType == 'html' || postResponseType == 'text'){
                    retObj.text = httpRequest.responseText;
                } else if (postResponseType == 'json'){
                    try {
                        eval('retObj.json = ' + httpRequest.responseText);
                    } catch(e){
                        if (typeof conf.errorHandler == 'function'){
                                                conf.errorHandler.call('json');
                                            }
                                            return;
                    }
                }
                
                
                                if (typeof conf.successHandler == 'function'){
                                        conf.successHandler.call(retObj);
                                }
                                return;
                
            } else {
                window.setTimeout(arguments.callee,10);
            }
            
        },10);
        
    }
    
    /////////////////////////////////////////
    //          JUICYFRAME CLASS           //
    /////////////////////////////////////////
    
    CJuicyFrame = function(selector){

        this.objects = [];
        this.length = 0;        
        
        if (selector instanceof CJuicyFrame){
            return selector;
        }
        
        if (typeof selector != 'string'){
            this.objects = [selector];
            this.length = 1;
            return this;
        }
        
        if (selector.substr(0,1) == '<'){
            var tagName = selector.match(/<([a-zA-Z0-9_\-]+)>/i);
            var tagCont = selector.match(/>(.{0,})</i);
            var crObj;
            
            tagName = tagName[1];
            tagCont = tagCont[1];
            
            crObj = document.createElement(tagName);
                        
                        if (crObj.innerHTML){
                            crObj.innerHTML = tagCont;
                        } else {
                            crObj.value = tagCont;
                        }
                        
            

            this.objects = [crObj];
            this.length = 1;
            return this;
        }
        
        if (useNative){
            
            if (typeof document.querySelectorAll == 'function'){
                this.objects = protosnodeTrans(document.querySelectorAll(selector));
                this.length = this.objects.length;
                return this;
            }
        }
        
        var allSelectors;
        var allSelectorsLen;
        var procSelectorsLen;
        var currSelector;
        var prevSelector;
        var foundSelectorsLen;
        var contextLen;
        var context = [document];
        var procSelectors = [];
        var foundSelectors = [];
        var results = [];
        var strSelector = '';
        var w,z;
        var sibling;
        var attrSSelector = /\+|~|>/g;
        
        selector = selector.replace(/~=/g,'&=');
        selector = selector.replace(/\+|>|~/g,' $& ');
        selector = selector.replace(/\s+/g,' ');
        
        allSelectors = selector.split(',');
        allSelectorsLen = allSelectors.length;
        
        for (var i = 0; i < allSelectorsLen; i++){
            
            context = [document];
            strSelector = '';
            
            /* +++ WORKING +++ */
            
            currSelector = allSelectors[i];
            currSelector = protostrim(currSelector);
            
            procSelectors = currSelector.split(' ');
            procSelectorsLen = procSelectors.length;
            
            for (j = 0; j < procSelectorsLen; j++){
                
                strSelector += procSelectors[j] + ' ';
                currSelector = procSelectors[j];
                
                if (currSelector.search(attrSSelector) != -1){
                    continue;
                } else {
                    
                    if (useCache){
                        if (typeof cache[strSelector] != 'undefined' && cache[strSelector][0] != null){
                            context = cache[strSelector];
                            contextLen = context.length;
                            continue;
                        }
                    }
                
                    prevSelector = procSelectors[j-1];
                    prevSelector = (typeof prevSelector == 'undefined') ? '' : prevSelector;
                    
                    if (prevSelector.search(attrSSelector) != -1){
                    
                        /**
                          * SELECTOR >
                          */
                        results = [];
                        if (procSelectors[j-1] == '>'){
                        
                            foundSelectors = protosobjSearch(currSelector,[document]);
                            foundSelectorsLen = foundSelectors.length;
                            
                            for (w = 0; w < contextLen; w++){
                                for (z = 0; z < foundSelectorsLen; z++){
                                    if (protosparent(foundSelectors[z]) == context[w]){
                                        results.push(foundSelectors[z]);
                                    }
                                }
                            }
                            
                            context = results;
                            contextLen = context.length;
                            cache[strSelector] = context;
                            continue;
                        }
                        
                        /**
                          * SELECTOR ~
                          */
                        results = [];
                        if (procSelectors[j-1] == '~'){
                        
                            foundSelectors = protosobjSearch(currSelector,[document]);
                            foundSelectorsLen = foundSelectors.length;
                            
                            for (w = 0; w < contextLen; w++){
                                sibling = context[w];
                                sibling = sibling.nextSibling;
                                while (sibling && sibling.nodeType != 1){
                                    sibling = sibling.nextSibling;
                                }
                                for (z = 0; z < foundSelectorsLen; z++){
                                    if (foundSelectors[z] != context[w]){

                                        if (sibling == foundSelectors[z]){
                                            results.push(foundSelectors[z]);
                                        } else { continue; }
                                        
                                        sibling = sibling.nextSibling;
                                        while (sibling && sibling.nodeType != 1){
                                            sibling = sibling.nextSibling;
                                        }
                                    
                                    }
                                }
                            }
                            
                            context = results;
                            contextLen = context.length;
                            cache[strSelector] = context;
                            
                            continue;
                        }
                        
                        /**
                          * SELECTOR +
                          */
                        results = [];
                        if (procSelectors[j-1] == '+'){
                            
                            foundSelectors = protosobjSearch(currSelector,[document]);
                            foundSelectorsLen = foundSelectors.length;
                            
                            for (w = 0; w < contextLen; w++){
                                sibling = context[w];
                                sibling = sibling.nextSibling;
                                while (sibling && sibling.nodeType != 1){
                                    sibling = sibling.nextSibling;
                                }
                                for (z = 0; z < foundSelectorsLen; z++){
                                    if (foundSelectors[z] != context[w]){
                                        if (sibling == foundSelectors[z]){
                                            results.push(foundSelectors[z]);
                                        }
                                    }
                                }
                            }
                            
                            context = results;
                            contextLen = context.length;
                            cache[strSelector] = context;
                            
                            continue;
                        }

                    } else {
                        if (useCache){
                            if (typeof cache[strSelector] != 'undefined' && cache[strSelector][0] != null){
                                alert(strSelector + ' ' + cache[strSelector][0]);
                                foundSelectors = cache[strSelector];
                                context = foundSelectors;
                                contextLen = context.length;
                                continue;
                            }
                        }
                        
                        foundSelectors = protosobjSearch(currSelector,context);
                        context = foundSelectors;
                        contextLen = context.length;
                        cache[strSelector] = context;
                        
                    }
                    
                }
            }
            
            this.objects = this.objects.concat(context);
        }
        
        if (!useCache){
            delete cache;
        }
        
        this.length = this.objects.length;
        
        if (this.length <= 0 || this.objects[0] == null){
            this.length = 0;
            this.objects = [];
        }
        
        return this;        
        
    }
    
    /////////////////////////////////////////
    //       JUICYFRAME EXTENSION          //
    /////////////////////////////////////////
    
    // Each element
    CJuicyFrame.prototype.each = function(callback){
        if (this.length <= 0){return this;}
        protoseach(this.objects,callback);
    }
    
    // Animate element params
    CJuicyFrame.prototype.animate = function(params,duration,type,callback){
        protosanimate(this.objects[0],params,duration,type,callback);
        return this;
    }
    
    // Stop animation
    CJuicyFrame.prototype.stop = function(stopCurrent,stopAll){
        if (this.length <= 0){return this;}
        if (stopCurrent == true){
            this.objects[0].stopAnim = true;
        }
        if (stopAll == true){
            globalAnimationStop = true;
        }
       // this.objects[0].animating = false;
        return this;
    }
    
    // Attach event
    CJuicyFrame.prototype.attachEvent = function(event,handler){
        if (this.length <= 0){return this;}
        protosattachEvent(this.objects[0],event,handler);
    }
    
    // detach event
    CJuicyFrame.prototype.detachEvent = function(event,handler){
        var handlersLen = this.objects[0]['callbacks'].length;
        if (this.length <= 0){return this;}
        for (var i = 0; i < handlersLen; i++){
            if (this.objects[0]['callbacks'][i] == handler){
                if (typeof removeEventListener == 'function'){
                    this.objects[0].removeEventListener(event,this.objects[0]['callSets'][i],false);
                } else if (typeof detachEvent == 'function') {
                    this.objects[0].detachEvent(event,this.objects[0]['callSets'][i]);
                } else {
                    this.objects[0]['on' + event] = null;
                }
            }
        }
    }
    
    // CSS
    CJuicyFrame.prototype.css = function(a,b){
        if (this.length <= 0){return this;}
        if (typeof b != 'undefined'){
            this.objects[0].style[a] = b;
            return this;
        } else {
            if (typeof a != 'object'){
                var computed = protoscomputedStyle(this.objects[0]);
                return computed[a];
            } else {
                for (var param in a){
                    this.objects[0].style[param] = a[param];
                }
                return this;
            }
        }
    }
    
    // Hover
    CJuicyFrame.prototype.hover = function(over,out){
        if (this.length <= 0){return this;}
            
            var obj = this;
            var interval;
            
            if (typeof out == 'function'){
                _out = function (e){
					e = protosieEventFix(e);
                    interval = window.setTimeout(function(){
                        out.call(obj,e);
                    },100);
                }
            } else {
                _out = function(e){}
            }

            this.objects[0].onmouseout = _out;// function(e){
               // interval = window.setTimeout(function(){
                   
               // },100);
            //}

            _over = function (e){
				e = protosieEventFix(e);
                window.clearTimeout(interval); 
                over.call(obj,e);
            }
            
                
            this.objects[0].onmouseover = _over;
            
        
    }
    
    // Click
    CJuicyFrame.prototype.click = function(callback){
        if (this.length <= 0){return this;}
        this.objects[0].onclick = callback;
        return this;
    }
    
    // Focus on element or call callback function on focus
    CJuicyFrame.prototype.focus = function(callback){
        if (this.length <= 0){return this;}
        if (typeof callback != 'undefined'){
            this.objects[0].onfocus = callback;
        } else {
            this.objects[0].focus();
        }
        return this;
    }
    
    // Blur on element or call callback function on blur
    CJuicyFrame.prototype.blur = function(callback){
        if (this.length <= 0){return this;}
        if (typeof callback != 'undefined'){
            this.objects[0].onblur = callback;
        } else {
            this.objects[0].blur();
        }
        return this;
    }
    
    // Get element value
    CJuicyFrame.prototype.value = function(){
        if (this.length <= 0){return this;}
        return this.objects[0].value;
    }
    
    // Set or get attribute value
    CJuicyFrame.prototype.attr = function(attr,value){
        if (this.length <= 0){return this;}
        protosfixClass(this.objects[0]);
        if (typeof value == 'undefined'){
            if (typeof attr != 'object'){
                return this.objects[0].getAttribute(attr);
            } else {
                for (var a in attr){
                    this.objects[0].setAttribute(a,attr[a]);
                    
                }
                protosfixClass(this.objects[0]);
                return this;
            }
        } else {
            this.objects[0].setAttribute(attr,value);
            protosfixClass(this.objects[0]);
            return this;
        }
    }
    
    // Check id element has attribute
    CJuicyFrame.prototype.hasAttr = function(attr){
        if (this.length <= 0){return this;}
        if (typeof hasAttribute == 'function'){
            return this.objects[0].hasAttribute(attr);
        } else {
            if (!document.addEventListener){
                return this.objects[0].getAttribute(attr) != '' & this.objects[0].getAttribute(attr) != null;
            } else {
                return this.objects[0].getAttribute(attr) != null;
            }
        }
        
    }
    
    // Remove attribute
    CJuicyFrame.prototype.removeAttr = function(attr){
        if (this.length <= 0){return this;}
        return this.objects[0].removeAttribute(attr);
    }
    
    // Save or get object property
    CJuicyFrame.prototype.prop = function(prop,value){
        if (this.length <= 0){return this;}
        if (typeof value == 'undefined'){
            if (typeof prop != 'object'){
                return this.objects[0][prop];
            } else {
                for (var param in prop){
                    this.objects[0][param] = prop[param];
                }
            }
        } else {
            this.objects[0][prop] = value; 
        }
    }
    
    // Get or set element inner html
    CJuicyFrame.prototype.html = function(value){
        if (this.length <= 0){return this;}
        if (typeof value != 'undefined'){
            this.objects[0].innerHTML = value;
            return this;
        } else {
            return this.objects[0].innerHTML;
        }
    }
    
    // Return parent node
    CJuicyFrame.prototype.parent = function(){
        if (this.length <= 0){return this;}
        this.objects[0] = protosparent(this.objects[0]); 
        return this;
    }
    
    // Return children node
    CJuicyFrame.prototype.children = function(selector){
        if (this.length <= 0){return this;}
        var retObj = new CJuicyFrame;
        if (typeof selector != 'undefined'){
            var objects = protosobjSearch(selector,[this.objects[0]]);
            retObj.objects = objects;
            retObj.length = objects.length;
            return retObj;
        } else {
            var node = this.objects[0].firstChild;
            while (node && node.nodeType != 1){
                node = node.nextSibling;
            }
            retObj.objects[0] = node;
            retObj.length = 1;
            return retObj;
        }
    }
    
    // Remove object
    CJuicyFrame.prototype.remove = function(){
        if (this.length <= 0){return this;}
        this.objects[0].parentNode.removeChild(this.objects[0]);
    }
    
    // Insert some element before
    CJuicyFrame.prototype.insertBefore = function(obj){
        if (this.length <= 0){return this;}
        protosparent(obj.objects[0]).insertBefore(this.objects[0],obj.objects[0]);
        return this;
    }
    
    // Insert some element into
    CJuicyFrame.prototype.insertInto = function(obj){
        if (this.length <= 0){return this;}
        obj.objects[0].appendChild(this.objects[0]);
        return this;
    }
    
    // Insert some element after
    CJuicyFrame.prototype.insertAfter = function(obj){
        var parent = protosparent(obj.objects[0]);
        var nexSibling = obj.objects[0].nextSibling;
        
        if (this.length <= 0){return this;}
        
        if (nexSibling){
            parent.insertBefore(this.objects[0],nexSibling);
        } else {
            parent.appendChild(this.objects[0]);
        }
        return this;
    }
    
    // fade in effect
    CJuicyFrame.prototype.fadeIn = function(duration,callback){
    
        var obj = this.objects[0];
        
        if (this.length <= 0){return this;}
    
        function fadeIn(){
    
            if (typeof duration == 'undefined'){
                duration = 500;
            }
        
            var st = protoscomputedStyle(obj);
            if (st['display'].search(/none/g) == -1 && st['opacity'].search(/0\.0/g) == -1){return obj;}
        
            obj.style['opacity'] = '0.0';
            obj.style['display'] = 'block';
            protosanimate(obj,{'opacity':'1.0'},duration,'linear',callback);
        
        }
        
        if (this.objects[0].animating == true){
            var waitingInterval = window.setInterval(function(){
                if (obj.animating == false){
                    clearInterval(waitingInterval);
                    fadeIn();
                }
            },10);
        } else {
            fadeIn();
        }
        
        
        return this;
    }
    
    // fade out effect
    CJuicyFrame.prototype.fadeOut = function(duration,callback){
    
        var obj = this.objects[0];
        
        if (this.length <= 0){return this;}
    
        function fadeOut(){
    
            if (typeof duration == 'undefined'){
                duration = 500;
            }
        
            var st = protoscomputedStyle(obj);
            if (st['display'].search(/none/g) != -1){return obj;}
        
            protosanimate(obj,{'opacity':'0.0'},duration,'linear',function(){
                this.style['opacity'] = '0.0';
                this.style['display'] = 'none';
                if (typeof callback == 'function'){
                    callback.call(this,this);
                }
            });
        
        }
        
        if (this.objects[0].animating == true){
            var waitingInterval = window.setInterval(function(){
                if (obj.animating == false){
                    clearInterval(waitingInterval);
                    fadeOut();
                }
            },10);
        } else {
            fadeOut();
        }
        
        return this;
    }
    
    // Show
    CJuicyFrame.prototype.show = function(duration,callback){
    
        var obj = this.objects[0];
        
        if (this.length <= 0){return this;}
        
        function show(){
            var st;
            var currW;
            var currH;
    
            if (typeof duration == 'undefined'){
                duration = 500;
            }
        
            st = protoscomputedStyle(obj);
            if (st['display'].search(/none/g) == -1 || obj.jfHiding || obj.jfShowing){return this;}
            obj.jfShowing = true;
        
            if (!obj.jfToggled){
                currW = st['width'];
                currH = st['height'];
        
                currW = parseFloat(isNaN(currW)) ? '0px' : currW;
                currH = parseFloat(isNaN(currH)) ? '0px' : currH;
        
                obj.svH = currH;
                obj.svW = currW;
            } else {
                currH = obj.svH;
                currW = obj.svW;
            }
        
            obj.jfToggled = true;
            obj.style['width'] = '0px';
            obj.style['height'] = '0px';
            obj.style['opacity'] = '0.0';
            obj.style['display'] = 'block';
        
            protosanimate(obj,{'opacity':'1.0','height':currH,'width':currW},duration,'linear',function(){
                this.jfShowing = false;
                if (typeof callback == 'function'){
                    callback.call(this,this);
                }
            });
        }
        
        if (this.objects[0].animating == true){
            var waitingInterval = window.setInterval(function(){
                if (obj.animating == false){
                    clearInterval(waitingInterval);
                    show();
                }
            },10);
        } else {
            show();
        }
        
        return this;
    }
    
    // Hide
    CJuicyFrame.prototype.hide = function(duration,callback){
        
        var obj = this.objects[0];
        
        if (this.length <= 0){return this;}
        
        function hide(){
        
            if (typeof duration == 'undefined'){
                duration = 500;
            }
        
            st = protoscomputedStyle(obj);
            if (st['display'].search(/none/g) != -1 || obj.jfShowing || obj.jfHiding){return this;}
            obj.jfHiding = true;
        
            if (!obj.jfToggled){
                currW = st['width'];
                currH = st['height'];
        
                currW = parseFloat(isNaN(currW)) ? '0px' : currW;
                currH = parseFloat(isNaN(currH)) ? '0px' : currH;
        
                obj.svH = currH;
                obj.svW = currW;
            } else {
                currH = obj.svH;
                currW = obj.svW;
            }
        
            obj.jfToggled = true;
        
            protosanimate(obj,{'opacity':'0.0','height':'0px','width':'0px'},duration,'linear',function(){
        
                this.jfHiding = false;
        
                this.style['opacity'] = '0.0';
                this.style['display'] = 'none';
            
                if (typeof this.svH != 'undefined'){
                    this.style['width'] = currW;
                    this.style['height'] = currH;
                }
            
                if (typeof callback == 'function'){
                    callback.call(this,this);
                }
            });
        
        }
        
        if (obj.animating == true){
            var waitingInterval = window.setInterval(function(){
                if (obj.animating == false){
                    clearInterval(waitingInterval);
                    hide();
                }
            },10);
        } else {
            hide();
        }
        
        return this;
    }
    
    CJuicyFrame.prototype.toggle = function(duration,callback){
        if (this.length <= 0){return this;}
        if (typeof callback != 'function'){
            callback = function(){}
        }
        if (protoscomputedStyle(this.objects[0])['display'].search(/none/g) != -1){
            this.show(duration,function(){
                callback.call(this,this);
            });
        } else {
            this.hide(duration,function(){
                callback.call(this,this);
            });
        }
        
        return this;
    }
    
    CJuicyFrame.prototype.slideDown = function(duration,callback){

        var obj = this.objects[0];
        
        if (this.length <= 0){return this;}
        
        function slideDown(){
            
            var st;
            var currH;
    
            if (typeof duration == 'undefined'){
                duration = 500;
            }
        
            st = protoscomputedStyle(obj);
            if (st['display'].search(/none/g) == -1 || obj.jfSlDown || obj.jfSlUp){return this;}
            obj.jfSlDown = true;

            if (!obj.jfSLToggled){
                
                currH = st['height'];
                currH = parseFloat(isNaN(currH)) ? '0px' : currH;
                obj.svH = currH;
            } else {
                currH = obj.svH;
            }            
        
            obj.jfSLToggled = true;
        
            obj.svH = currH;
            obj.style['height'] = '0px';
            obj.style['opacity'] = '0.0';
            obj.style['display'] = 'block';
        
            protosanimate(obj,{'opacity':'1.0','height':currH},duration,'linear',function(){
            
                this.jfSlDown = false;
                if (typeof callback == 'function'){
                    callback.call(this,this);
                }
            });
        
        }
        
        if (obj.animating == true){
            var waitingInterval = window.setInterval(function(){
                if (obj.animating == false){
                    clearInterval(waitingInterval);
                    slideDown();
                }
            },10);
        } else {
            slideDown();
        }
        
        return this;
    }
    
    CJuicyFrame.prototype.slideUp = function(duration,callback){
        
        var obj = this.objects[0];
        
        if (this.length <= 0){return this;}
        
        function slideUp(){
        
            if (typeof duration == 'undefined'){
                duration = 500;
            }
        
            var st = protoscomputedStyle(obj);
            if (st['display'].search(/none/g) != -1 || obj.jfSlDown || obj.jfSlUp){return this;}
            obj.jfSlUp = true;
        
            if (!obj.jfSLToggled){
                currH = st['height'];
                currH = parseFloat(isNaN(currH)) ? '0px' : currH;
                obj.svH = currH;
            } else {
                currH = obj.svH;
            }
        
            obj.jfSLToggled = true;
        
            protosanimate(obj,{'opacity':'0.0','height':'0px'},duration,'linear',function(){
        
                this.jfSlUp = false;
        
                this.style['opacity'] = '0.0';
                this.style['display'] = 'none';
            
                if (typeof this.svH != 'undefined'){
                    this.style['height'] = currH;
                }
            
                if (typeof callback == 'function'){
                    callback.call(this,this);
                }
            });
            
        }
        
        if (obj.animating == true){
            var waitingInterval = window.setInterval(function(){
                if (obj.animating == false){
                    clearInterval(waitingInterval);
                    slideUp();
                }
            },10);
        } else {
            slideUp();
        }
        
        return this;
    
    }
    
    CJuicyFrame.prototype.slideToggle = function(duration,callback){
        if (this.length <= 0){return this;}
        if (protoscomputedStyle(this.objects[0])['display'].search(/none/g) != -1){
            this.slideDown(duration,callback);
        } else {
            this.slideUp(duration,callback);
        }
        return this;
    }
    
    CJuicyFrame.prototype.addClass = function(addClass){
        var classes = [];
        var classesLen = 0;
        
        if (this.length <= 0){return this;}
        
        classes = this.attr('class');
        classes = classes.split(' ');
        classesLen = classes.length;
        
        for (var i = 0; i < classesLen; i++){
            classes[i] = protostrim(classes[i]);
        }
        
        if (!protosinArray(classes,addClass)){
            classes.push(addClass);
            this.attr('class',classes.join(' '));
        }
        
        protosfixClass(this.objects[0]);
        
        return this;
    }
    
    CJuicyFrame.prototype.removeClass = function(removeClass){
    
        var classes = [];
        var classesLen = 0;
        
        if (this.length <= 0){return this;}
        
        classes = this.attr('class');
        
        classes = classes.split(' ');
        classesLen = classes.length;
        
        for (var i = 0; i < classesLen; i++){
            classes[i] = protostrim(classes[i]);
            if (classes[i] == removeClass){
                classes.splice(i,1);
            }
        }

        this.attr('class',classes.join(' ') + ' ');
        
        return this;
    }
    
    CJuicyFrame.prototype.toggleClass = function(className){
        
        var classes = [];
        var classesLen = 0;
        
        if (this.length <= 0){return this;}
        
        classes = this.attr('class');
        classes = classes.split(' ');
        classesLen = classes.length;
        
        for (var i = 0; i < classesLen; i++){
            classes[i] = protostrim(classes[i]);
        }
        
        if (!protosinArray(classes,className)){
            classes.push(className);
        } else {
            for (var i = 0; i < classesLen; i++){
                if (classes[i] == className){
                    classes.splice(i,1);
                }
            }
        }
        
        this.attr('class',classes.join(' '));
        return this;
    }
    
    CJuicyFrame.prototype.hasClass = function(className){
        var classes = [];
        
        if (this.length <= 0){return this;}
        
        classes = this.attr('class');        
        classes = classes.split(' ');
        
        if (protosinArray(classes,className)){
            return true;
        }
        
        return false;
    }
    
    CJuicyFrame.prototype.computed = function(param){
        if (typeof param != 'undefined'){
            return protoscomputedStyle(this.objects[0])[param];
        }
        return protoscomputedStyle(this.objects[0]);
    }
    
    CJuicyFrame.prototype.ready = function(callback){
            
            if (this.length <= 0){return this;}
            
            var obj = this;
            
            
            var generalCallback = function(){
                
                if (readyCalled){return;}
                readyCalled = true;
                
                var len = readyCallbacks.length;
                for (var i = 0; i < len; i++){
                    readyCallbacks[i].call(obj);
                }
            }
            
            readyCallbacks.push(callback);
            
        
        if (this.objects[0] === window){
            this.attachEvent('load',generalCallback);
                        //window.onload = callback;
        } else if (this.objects[0] === document){
                    
                    if (document.addEventListener) {
                            document.addEventListener('DOMContentLoaded',generalCallback,false);
                    } else {
                        window.onload = generalCallback;
                    }
                        
            
        }
    
    }
    
    /////////////////////////////////////////
    //          SELECTOR SETTINGS          //
    /////////////////////////////////////////
    
    $ = function(selector){
        return new CJuicyFrame(selector);
    }
    
    $.addPseudo = function(pseudo,callback){
        pseudos[pseudo] = callback;
    }
    
    $.config = function(conf){
        for (var c in conf){
            switch (c){
                case 'useCache' : useCache = conf[c];
                break;
                
                case 'useNative' : useNative = conf[c];
                break;
            }
        }
    }
    
    $.addAnimFunc = function(name,func){
        animPresets[name] = func;
    }
    
    $.ajax = function(conf){
        protosajax(conf);
    }
    
    $.post = function(url,data,succsessHandler,errorHandler){            
        protosajax({
                    'url' : url,
                    'data' : data,
                    'method' : 'POST',
                    'errorHandler' : errorHandler,
                    'successHandler' : succsessHandler,
                    'type' : 'html',
                    'synch' : false,
                    'cache' : false
                });
    }
    
    $.get = function(url,data,succsessHandler,errorHandler){
        protosajax({
                    'url' : url,
                    'data' : data,
                    'method' : 'GET',
                    'errorHandler' : errorHandler,
                    'successHandler' : succsessHandler,
                    'type' : 'html',
                    'synch' : false,
                    'cache' : false
                });
    }
    
    $.match = function(pattern,flags,string,matchMode){

        var AllLangs = '';
        var Wpattern;
        var reg;
        
        var Languages = {
            Russian : '\u0410-\u042F\u0410-\u042F\u0401\u0451',
            English : 'a-zA-Z',
            Japan : '\u3041-\u3096\u30A1-\u30FA',
            CJKUnified : '\u4E00-\u9FA5',
            Numerlic : '0-9',
            Extensions : '_'
        }
        
        for (var language in Languages){
            AllLangs += Languages[language];
        }

        pattern = pattern.replace('\\m',AllLangs);
        reg = new RegExp(pattern,flags);
        
        if (typeof matchMode != 'undefined' && matchMode == true){
            return string.match(reg);
        } else {
            return reg.test(string);
        }
    }
    
    /////////////////////////////////////////
    //         STANDART EXTENSIONS         //
    /////////////////////////////////////////
    
    $.addAnimFunc('elastic',function(){
        return Math.pow(2,10*(this-1))*Math.cos(20*Math.PI*1.5/3*this);
    });
	
	$.addAnimFunc('linear',function(){
        return this;
    });
    
	$.addAnimFunc('quad',function(){
        return Math.pow(this,2);
    });
	
	$.addAnimFunc('hyper',function(){
        return Math.pow(this,3);
    });
	
	$.addAnimFunc('quint',function(){
        return Math.pow(this,5);
    });
	
	$.addAnimFunc('circ',function(){
        return 1 - Math.sin(Math.acos(this));
    });
	
	$.addAnimFunc('back',function(){
        return Math.pow(this,2)*((1.5+1)*this-1.5);
    });
	
	$.addAnimFunc('bounce',function(){
        for(var a=0,b=1,result;1;a+=b,b/=2) {
			if (this >= (7-4*a)/11) {
			  return -Math.pow((11-6*a-11*this)/4,2) + Math.pow(b,2);
			}
		}
    });
	
	$.addAnimFunc('elasticEaseOut',function(){
        return protosmakeEaseOut(animPresets['elastic'],this);
    });
	
	$.addAnimFunc('linearEaseOut',function(){
        return protosmakeEaseOut(animPresets['linear'],this);
    });
    
	$.addAnimFunc('quadEaseOut',function(){
        return protosmakeEaseOut(animPresets['quad'],this);
    });
	
	$.addAnimFunc('hyperEaseOut',function(){
        return protosmakeEaseOut(animPresets['hyper'],this);
    });
	
	$.addAnimFunc('quintEaseOut',function(){
        return protosmakeEaseOut(animPresets['quint'],this);
    });
	
	$.addAnimFunc('circEaseOut',function(){
        return protosmakeEaseOut(animPresets['circ'],this);
    });
	
	$.addAnimFunc('backEaseOut',function(){
        return protosmakeEaseOut(animPresets['back'],this);
    });
	
	$.addAnimFunc('bounceEaseOut',function(){
        return protosmakeEaseOut(animPresets['bounce'],this);
    });
	
	$.addAnimFunc('elasticEaseInOut',function(){
        return protosmakeEaseInOut(animPresets['elastic'],this);
    });
	
	$.addAnimFunc('linearEaseInOut',function(){
        return protosmakeEaseInOut(animPresets['linear'],this);
    });
    
	$.addAnimFunc('quadEaseInOut',function(){
        return protosmakeEaseInOut(animPresets['quad'],this);
    });
	
	$.addAnimFunc('hyperEaseInOut',function(){
        return protosmakeEaseInOut(animPresets['hyper'],this);
    });
	
	$.addAnimFunc('quintEaseInOut',function(){
        return protosmakeEaseInOut(animPresets['quint'],this);
    });
	
	$.addAnimFunc('circEaseInOut',function(){
        return protosmakeEaseInOut(animPresets['circ'],this);
    });
	
	$.addAnimFunc('backEaseInOut',function(){
        return protosmakeEaseInOut(animPresets['back'],this);
    });
	
	$.addAnimFunc('bounceEaseInOut',function(){
        return protosmakeEaseInOut(animPresets['bounce'],this);
    });
    
    $.addPseudo(':odd',function(a){
        var aLen = a.length;
        var res = [];
        for (var i = 0; i < aLen; i++){
            if (i % 2 == 0){
                res.push(a[i]);
            }
        }
        return res;
    });
    
    $.addPseudo(':even',function(a){
        var aLen = a.length;
        var res = [];
        for (var i = 0; i < aLen; i++){
            if (i % 2 != 0){
                res.push(a[i]);
            }
        }
        return res;
    });
    
    $.addPseudo(':first-child',function(a){
        return [a[0]];
    });
    
    $.addPseudo(':empty',function(a){
        var aLen = a.length;
        var res = [];
        for (var i = 0; i < aLen; i++){
            if (a[i].innerHTML == ''){
                res.push(a[i]);
            }
        }
        return res;
    });
    
    /////////////////////////////////////////
    //              ADDITIONALS            //
    /////////////////////////////////////////
    
    $.fn = {}
    F = JuicyFrame = JF = $;

})();