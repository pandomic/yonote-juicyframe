(function(juicy){
    
    function protoscomputedStyle(elem){
        if (typeof window.getComputedStyle == 'function'){
            return getComputedStyle(elem,null);
        } else {
            return elem.currentStyle;
        }
    }
    
    protosanimate = function(object,newR,newG,newB,duration,paramName,type,callback){

        var currentStyle = protoscomputedStyle(object);
        var animParam = (paramName == 'color') ? 'color' : (paramName == 'bgColor') ? 'backgroundColor' : 'background';
        
        duration = (typeof duration == 'undefined') ? 400 : duration;
        function animator(){
    
            var conf = [];
            var timeOutCounter;
            var animStart = new Date().getTime();
            var animProgress;
            var animType;
            var a,b;
            var currAnim;
            
            var R,G,B;
            
            var currentColor = currentStyle[animParam];
                currentColor = (animParam == 'background' && (currentColor == '' || typeof currentColor == 'undefined')) ? currentStyle['backgroundColor'] : currentColor;
                
            if (/#/g.test(currentColor)){

                currentColor = currentColor.match(/([a-zA-Z0-9]){2}/g);
                
                R = parseInt(currentColor[0],16);
                G = parseInt(currentColor[1],16);
                B = parseInt(currentColor[2],16);
            } else {

                currentColor = currentColor.match(/[0-9]+/g);
                
                R = parseFloat(currentColor[0]);
                G = parseFloat(currentColor[1]);
                B = parseFloat(currentColor[2]);
                
                
            }
            var animR = 0;
            var animG = 0;
            var animB = 0;
    
            object.animatingColor = true;
            object.stopAnim = false;
                
            timeOutCounter = window.setTimeout(function(){
    
                currAnim = new Date().getTime() - animStart;
                animProgress = currAnim/duration;
      
                if (typeof type == 'undefined' || type == 'linear'){
                    animType = animProgress;
                } else {
                    if (type == 'parabolic'){
                        animType = Math.pow(animProgress,3);
                    } else if (type == 'circ'){
                        animType = 1 - Math.sin(Math.acos(animProgress));
                    } else if (type == 'back'){
                        animType = Math.pow(animProgress, 2) * ((1.5 + 1) * animProgress - 1.5);
                    } else if (type == 'bounce'){
                        for(a = 0, b = 1; 1; a += b, b /= 2) {
                            if (animProgress >= (7 - 4 * a) / 11){
                                animType = -Math.pow((11 - 6 * a - 11 * animProgress) / 4, 2) + Math.pow(b, 2);
                                break;
                            }
                        }
                    } else if (type == 'elastic'){
                        animType = Math.pow(2,10 * (animProgress - 1)) * Math.cos(20 * animProgress * Math.PI * 1.5 / 3);
                    } else if (type == 'easyOut'){
                        for(a = 0, b = 1; 1; a += b, b /= 2) {
                            if ((1 - animProgress) >= (7 - 4 * a) / 11){
                                animType = -Math.pow((11 - 6 * a - 11 * (1 - animProgress)) / 4, 2) + Math.pow(b, 2);
                                break;
                            }
                        }
                        animType = 1 - animType;
                    }
                }
                
                animR = (newR - R) * animType + R;
                animG = (newG - G) * animType + G;
                animB = (newB - B) * animType + B;

                /*animR = (animR > 255) ? newR : (animR < 0) ? 0 : animR;
                animG = (animG > 255) ? newG : (animG < 0) ? 0 : animG;
                animB = (animB > 255) ? newB : (animB < 0) ? 0 : animB;*/
                    
                animR = Math.ceil(animR);
                animG = Math.ceil(animG);
                animB = Math.ceil(animB);
                    
                object.style[animParam] = 'rgb(' + animR + ',' + animG + ',' + animB + ')';
                if (animProgress < 1 && object.stopAnim != true){
                    timeOutCounter = window.setTimeout(arguments.callee,0);
                } else {
                    object.animatingColor = false;
                    if (typeof callback == 'function'){
                        callback.call(object);
                    }
                    clearTimeout(timeOutCounter);
                    return 0;
                }
        
            },0);
        }
        
        if (object.animatingColor == true){
            var waitingInterval = window.setInterval(function(){
                if (object.animatingColor == false){
                    clearInterval(waitingInterval);
                    animator();
                }
            },10);
        } else {
            animator();
        }
    }
    
    
    function protosSlider(obj,params,callback){

        params.min = (typeof params.min == 'undefined') ? 0 : params.min;
        params.len = (typeof params.len == 'undefined') ? 100 : params.len;
        params.max = (typeof params.max == 'undefined') ? params.len : params.max;
        params.type = (typeof params.type == 'undefined') ? 'h' : params.type.toLowerCase();
        
        var useSlideCont = false;
        var slideContDimens;
        var slideContParam;
        var slideContParent;
        
        if (typeof params.slideCont != 'undefined'){
        
            slideContParent = JF(params.slideCont.objects[0]).parent().objects[0];
        
            useSlideCont = true;
            
            params.slideContType = (typeof params.slideContType == 'undefined') ? 'h' : params.slideContType.toLowerCase();
            params.slideWheelStep = (typeof params.slideWheelStep == 'undefined') ? 10 : params.slideWheelStep;
            
            if (params.slideContType == 'h'){
                slideContDimens = params.slideCont.objects[0].offsetWidth-slideContParent.offsetWidth/1.5;
                slideContParam = 'marginLeft';
            } else if (params.slideContType == 'v') {
                slideContDimens = params.slideCont.objects[0].offsetHeight-slideContParent.offsetHeight/1.5;
                slideContParam = 'marginTop';
            }
            
            params.len = params.max = slideContDimens;
            
        }
        
        var startPosX;
        var startPosY;
        
        var offsetX;
        var offsetY;
        
        var currX;
        var currY;
        
        var canMove = true;
        
        var pxPerUnitH = (obj.offsetHeight-params.handler.objects[0].offsetHeight)/params.len;
        var pxPerUnitW = (obj.offsetWidth-params.handler.objects[0].offsetWidth)/params.len;
        
        if (params.type == 'h'){
            params.handler.css('marginLeft',params.min*pxPerUnitW+'px');
        } else if (params.type == 'v'){
            params.handler.css('marginTop',params.min*pxPerUnitH+'px');
        }
        
        if (typeof params.currPos != 'undefined'){
            if (params.type == 'h'){
                params.handler.css('marginLeft',params.currPos*pxPerUnitW+'px');
            } else if (params.type == 'v'){
                params.handler.css('marginTop',params.currPos*pxPerUnitH+'px');
            }
        }
        
        var currOffsetH;
        var currOffsetW;
            
        var canScroll = true;
        
        params.handler.attachEvent('mousedown',function(e){
            
            if (e.preventDefault){
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
            
            currOffsetH = parseFloat(params.handler.css('marginTop'));
            currOffsetH = (isNaN(currOffsetH)) ? 0 : currOffsetH;
            currOffsetW = parseFloat(params.handler.css('marginLeft'));
            currOffsetW = (isNaN(currOffsetW)) ? 0 : currOffsetW;
            
            startPosX = e.clientX;
            startPosY = e.clientY;
            
            canMove = true;
            
            JF(document).attachEvent('mousemove',function(e){
            
                if (e.preventDefault){
                    e.preventDefault();
                } else {
                    e.returnValue = false;
                }
            
                if (canMove){
            
                    offsetX = e.clientX-startPosX;
                    offsetY = e.clientY-startPosY;
                    
                    currX = currOffsetW + offsetX;
                    currY = currOffsetH + offsetY;
                    
                    if (params.type == 'h'){
                        if (currX >= params.min * pxPerUnitW && currX < params.max * pxPerUnitW){
                            params.handler.css('marginLeft',currX+'px');
                            if (useSlideCont){
                                params.slideCont.css(slideContParam,-currX/pxPerUnitW+'px');
                            }
                            callback.call(Math.ceil(currX/pxPerUnitW));
                        }
                    } else if (params.type == 'v'){
                        if (currY >= params.min * pxPerUnitH && currY < params.max * pxPerUnitH){
                            params.handler.css('marginTop',currY+'px');
                            if (useSlideCont){
                                params.slideCont.css(slideContParam,-currY/pxPerUnitH+'px');
                            }
                            callback.call(Math.ceil(currY/pxPerUnitH));
                        }
                    }
                
                }
            
            });
            
            JF(document).attachEvent('mouseup',function(e){
                canMove = false;
            });
            
            
        });
        
        function repaint(){
            var currParamVal = parseFloat(JF(params.slideCont.objects[0]).css(slideContParam));
                currParamVal = (isNaN(currParamVal)) ? 0 : currParamVal;
            
            currParamVal = Math.ceil(currParamVal);
            
            if (params.type == 'h'){
                params.handler.css('marginLeft',-Math.ceil(currParamVal*pxPerUnitW)+'px');
            } else if (params.type == 'v'){
                params.handler.css('marginTop',-Math.ceil(currParamVal*pxPerUnitH)+'px');
            }
            
            callback.call(-currParamVal);
        }
        
        function scroll(e){
            
                e = e || window.event;
                
                var wDelta;
                var oldParamVal;
                
                oldParamVal = parseFloat(JF(params.slideCont.objects[0]).css(slideContParam));
                oldParamVal = (isNaN(oldParamVal)) ? 0 : oldParamVal;
                //oldParamVal = Math.abs(oldParamVal);
                
                if (e.wheelDelta){
                    wDelta = e.wheelDelta;
                } else {
                    wDelta = -e.detail;
                }
                
                wDelta = (wDelta > 0) ? 1 :-1;
                if (canScroll){
                    params.slideCont.css(slideContParam,oldParamVal+params.slideWheelStep*wDelta+'px');
                    if (oldParamVal+params.slideWheelStep*wDelta > 0){
                    
                        //canScroll = false;
                        
                        if (params.slideContType == 'h'){
                            params.slideCont.css({'marginLeft':'0px'});//,400,'linear',function(){
                                //anScroll = true;
                                repaint();
                            //});
                        } else if (params.slideContType == 'v') {
                            params.slideCont.css({'marginTop':'0px'});//,400,'linear',function(){
                                //canScroll = true;
                                repaint();
                            //});
                        }
                        
                        
                    } else if (oldParamVal+params.slideWheelStep*wDelta < -slideContDimens){
                    
                        //canScroll = false;
                        
                        if (params.slideContType == 'h'){
                            params.slideCont.css({'marginLeft':-slideContDimens+'px'});//,400,'linear',function(){
                                //canScroll = true;
                                repaint();
                            //});
                        } else if (params.slideContType == 'v') {
                            params.slideCont.css({'marginTop':-slideContDimens+'px'});//,400,'linear',function(){
                                //canScroll = true;
                                repaint();
                            //});
                        }
                        
                    } else {
                        repaint();
                    }
                    
                }
                
                
                if (e.stopPropagation){
                    e.stopPropagation();
                } else {
                    e.cancelBubble = true;
                }
                
                if (e.preventDefault){
                    e.preventDefault();
                } else {
                    e.returnValue = false;
                }
                
            }
            
            if (useSlideCont){                    
                    
                    if (slideContParent.addEventListener){
                        slideContParent.addEventListener('DOMMouseScroll',scroll,false);
                        obj.addEventListener('DOMMouseScroll',scroll,false);
                    }
                    
                    slideContParent.onmousewheel = scroll;
                    obj.onmousewheel = scroll;
                
            }
        
    }
    
    function protosDropDown(object,params){
        
        var dropDownCurrentText;
        //var dropDownName;
        var textFound = false;
        var listOpen = false;
        
        var dropDownContainer;
        var dropListContainer;
        var originalList;
        
        object.css('display','none');
        
        /*function rebuild(sel,objSelector){
            
            JF('div[name="' + objSelector + '"]').each(function(){
                JF(this).removeClass(params.dropDownSelectedClass);
                JF(this).removeClass(params.dropDownHoverClass);
                JF(this).removeAttr('selected');
            });
            
            JF(sel).children('option').each(function(){
                JF(this).removeAttr('selected');
            });
            
        }*/
        
        object.children('option').each(function(){
            if (JF(this).hasAttr('selected')){
                dropDownCurrentText = JF(this).html();
                
                textFound = true;
            }
        });
        
        if (!textFound){
            dropDownCurrentText = object.children('option').html();
            object.children('option').attr('selected','selected');
        }
        
        //dropDownName = 'juicy_' + object.attr('name');
        
        dropDownContainer = JF('<div></div>').attr('class',params.normalClass)./*attr('name',dropDownName).*/insertAfter(object);
        dropListContainer = JF('<div></div>').css('display','none').insertInto(dropDownContainer).attr('class',params.dropListClass);
        JF('<span></span>').insertInto(dropDownContainer).html(dropDownCurrentText);
                
                
        
        
        function rebuild(selected){
            if (typeof selected == 'object'){
                dropListContainer.children('div').each(function(){
                    JF(this).attr('class',params.dropDownClass);
                    if (this === JF(selected).objects[0]){
                        JF(this).attr('class',params.dropDownSelectedClass);
                        JF(this).attr('selected','selected');
                        JF(dropDownContainer).children('span').html(JF(JF(this).prop('selectlink')).html());
                        JF(object).children('option').each(function(){
                            JF(this).removeAttr('selected');
                        });
                        JF(JF(this).prop('selectlink')).attr('selected','selected');
                    } else {
                        JF(this).removeAttr('selected');
                    }
                });
            } else {
                dropListContainer.children('div').each(function(){
                    JF(this).attr('class',params.dropDownClass);
                    if (JF(this).attr('selected') == 'selected'){
                        JF(this).attr('class',params.dropDownSelectedClass);
                        JF(JF(this).prop('selectlink')).attr('selected','selected');
                    }
                });
            }
        }
        
        object.children('option').each(function(){
            if (JF(this).hasAttr('selected')){
                JF('<div></div>').attr('class',params.dropDownSelectedClass).attr('selected','selected').insertInto(dropListContainer).html(JF(this).html()).attr('value',JF(this).attr('value')).prop('selectlink',this);
            } else {
                JF('<div></div>').attr('class',params.dropDownClass).insertInto(dropListContainer).html(JF(this).html()).attr('value',JF(this).attr('value')).prop('selectlink',this);
            }
        });
        
        if (typeof params.dropExecutor != 'undefined'){
            if (typeof params.dropExecutor == 'object'){
                for (var i = 0; i < params.dropExecutor.length; i++){
                    JF(params.dropExecutor[i]).click(function(){
                        if (listOpen){
                            dropListContainer.css('display','none');
                            //rebuild();
                            listOpen = false;
                        } else {
                            dropListContainer.css('display','block');
                            listOpen = true;
                        }
                    });
                }
            } else if (typeof params.dropExecutor == 'string'){
                JF(params.dropExecutor).click(function(){
                    if (listOpen){
                        dropListContainer.css('display','none');
                        //rebuild();
                        listOpen = false;
                    } else {
                        dropListContainer.css('display','block');
                        listOpen = true;
                    }
                });
            }
            
        }
        
        dropDownContainer.click(function(){
            if (listOpen){
                dropListContainer.css('display','none');
                rebuild();
                listOpen = false;
            } else {
                dropListContainer.css('display','block');
                listOpen = true;
            }
        });
        
        dropListContainer.children('div').each(function(){
            
            JF(this).click(function(){
                dropListContainer.css('display','none');
                rebuild(this);
            });
            
            JF(this).hover(function(){
                JF(this).addClass(params.dropDownHoverClass);
            },function(){
                JF(this).removeClass(params.dropDownHoverClass);
            });
            
        });
        
        
    }
        
        function protosDropDownMiltiple(object,params){
            
            /*
             * params.containerClass
             * params.optionClass
             * params.optionSelectedClass
             * params.optionHoverClass
             */
            
            var newSelect = JF('<div></div>').attr('class',params.containerClass).insertAfter(object);
            object.css('display','none');
            
            object.children('option').each(function(){
                if (JF(this).hasAttr('selected')){
                    JF('<div></div>').attr({'class':params.optionSelectedClass,'selected':'selected','value':JF(this).attr('value')}).insertInto(newSelect).html(JF(this).html()).prop('linktoopt',JF(this));
                } else {
                    JF('<div></div>').attr({'class':params.optionClass,'value':JF(this).attr('value')}).insertInto(newSelect).html(JF(this).html()).prop('linktoopt',JF(this));
                }
            });
            
            function changeChildrenOption(action){
                object.children('option').each(function(){
                    if (JF(this).attr('value') == value){
                        if (action == 'bind'){
                            JF(this).attr('selected','selected');
                        } else {
                            JF(this).removeAttr('selected');
                        }
                    }
                });
            }
            
            newSelect.children('div').each(function(){
                
                JF(this).hover(function(){
                    JF(this).addClass(params.optionHoverClass);
                },function(){
                    JF(this).removeClass(params.optionHoverClass);
                });
                
                JF(this).click(function(){
                    if (JF(this).hasAttr('selected')){
                        JF(this).removeAttr('selected');
                        JF(this).prop('linktoopt').removeAttr('selected');
                        JF(this).attr('class',params.optionClass);
                        //changeChildrenOption(JF(this).attr('value'),'unbind');
                    } else {
                        JF(this).attr('selected','selected');
                        JF(this).attr('class',params.optionSelectedClass);
                        JF(this).prop('linktoopt').attr('selected','selected');
                        //changeChildrenOption(JF(this).attr('value'),'bind');
                    }
                    
                });
                
            });
            
            
            
            
        }
    
    juicy.prototype.slider = function(params,callback){
        if (this.length <= 0){return this;}
        protosSlider(this.objects[0],params,callback);
        
    }
    
    juicy.prototype.colorAnim = function(newR,newG,newB,duration,paramName,type,callback){
        if (this.length <= 0){return this;}
        protosanimate(this.objects[0],newR,newG,newB,duration,paramName,type,callback);
        return this;
    }
    
    juicy.prototype.dropDown = function(params){
    
        if (this.length <= 0){return this;}        
        protosDropDown(this,params);
        return this;
    }
        
        juicy.prototype.dropDownMultiple = function(params){
    
        if (this.length <= 0){return this;}        
        protosDropDownMiltiple(this,params);
        return this;
    }
    
    juicy.prototype.hiddenValue = function(){
            
                if (this.length <= 0){return this;}    
        var start = this.objects[0].value;
        
        JF(this).focus(function(){
            if (this.value == start){
                this.value = '';
            }
        });
        
        JF(this).blur(function(){
            if (this.value == ''){
                this.value = start;
            }
        });
        
    }
    
    juicy.prototype.radio = function(params,refresh,callback){
        
        /*
         * params.enabledClass
         * params.disabledClass
         * params.hoverClass
         */
        
        var obj = this;
        var divObj;
        var thisChecked = this.hasAttr('checked');
        
        if (refresh){
            if (thisChecked){
                obj.prop('divObj').attr('class',params.enabledClass);
            } else {
                obj.prop('divObj').attr('class',params.disabledClass);
            }
            return;
        }
        alert();
        this.css('display','none');
        
        divObj = JF('<div></div>').insertAfter(this);
        obj.prop('divObj',divObj);
        
        if (thisChecked){
            divObj.attr('class',params.enabledClass);
        } else {
            divObj.attr('class',params.disabledClass);
        }
        
        divObj.attachEvent('click',function(){
            if (!obj.hasAttr('checked')){
                
                JF('input' + '[name="' + obj.attr('name') + '"]').each(function(){
                    JF(this).removeAttr('checked');
                    JF(this).prop('divObj').attr('class',params.disabledClass);
                });
                
                obj.attr('checked','checked');
                divObj.attr('class',params.enabledClass);
            }
            if (typeof callback != 'undefined'){
                callback.call(divObj,obj);
            }
        });
        
        divObj.hover(function(){
            JF(this).addClass(params.hoverClass);
        },function(){
            JF(this).removeClass(params.hoverClass);
        });
        
    }
        
    juicy.prototype.checkbox = function(params,refresh,callback){
        
        /*
         * params.enabledClass
         * params.disabledClass
         * params.hoverClass
         */
            
        var obj = this;
        var divObj;
        var thisChecked = this.hasAttr('checked');
        
        if (refresh){
            if (thisChecked){
                obj.prop('divObj').attr('class',params.enabledClass);
            } else {
                obj.prop('divObj').attr('class',params.disabledClass);
            }
            return;
        }
        
        this.css('display','none');
        
        divObj = JF('<div></div>').insertAfter(this);
        obj.prop('divObj',divObj);
        //divObj = JF('div[name="' + thisName + '"]');
        
        
        if (thisChecked){
            divObj.attr('class',params.enabledClass);
        } else {
            divObj.attr('class',params.disabledClass);
        }
        
        divObj.attachEvent('click',function(){
            if (obj.hasAttr('checked')){
                obj.removeAttr('checked');
                divObj.attr('class',params.disabledClass);
            } else {
                obj.attr('checked','checked');
                divObj.attr('class',params.enabledClass);
            }
            if (typeof callback != 'undefined'){
                callback.call(divObj,obj);
            }
        });
        
        divObj.hover(function(){
            JF(this).addClass(params.hoverClass);
        },function(){
            JF(this).removeClass(params.hoverClass);
        });
            
    }
    
})(CJuicyFrame);