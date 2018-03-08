(function ($) {
    $.fn.simpleAjaxSubmit = function(selector, options){

        //setup options
        var defaults = {
                action: null,
                parent_selector: null,
                scroll_top_offset_selector: null,
                csrf_token_field_name: 'csrf'
            },
            opts = $.extend(defaults, options || selector);

        //bind main submit event
        this.on('submit', function(e){
            e.preventDefault();

            var form = $(e.target),
                button = form.find('[type=submit]'),
                data = form.serialize(),
                action = opts.action ? opts.action : form.attr('action');

            if(button.attr('disabled')){
                return;
            }

            button.attr('disabled', 'disabled');
            button.addClass('running');
            helpers.clearErrors(form);

            $.post(action, data, function(resp){
                //swap csrf key with fresh one
                if(resp[opts.csrf_token_field_name]){
                    form.find('[name="'+opts.csrf_token_field_name+'"]').val(resp[opts.csrf_token_field_name]);
                }

                //if custom callback specified
                var callback = form.data('callback');
                if(callback){
                    if(!callback.apply(this, arguments)){
                        return;
                    }
                }

                button.removeAttr('disabled');
                button.removeClass('running');

                //do status specific actions
                if(resp.status == 'invalid' && resp.data){
                    helpers.appendErrors(form, resp.data);
                    helpers.setCorrectClasses(form);
                }
                if(resp.status == 'error'){
                    if(!resp.alert_msg){
                        if(typeof swal !== 'undefined'){
                            swal({
                                title: "",
                                text: 'Unknown error occurred',
                                type: 'error'
                            });
                        }
                        else{
                            console.error('Unknown error occurred');
                        }
                    }
                }
                if(resp.status == 'success'){}

                var callback = form.data('sas-shutdown');
                if(callback){
                    if(!callback.apply(this, arguments)){
                        return;
                    }
                }

                //clear the form if specified
                if(resp.clear_form){
                    var reset = $('<input />', {type: 'reset'});
                    reset.hide();
                    form.append(reset);
                    reset.click();
                    reset.remove();
                }

                //show message if passed
                if(resp.alert_msg){
                    swal({
                        title: "",
                        text: resp.alert_msg,
                        type: resp.status == 'invalid' ? 'warning' : resp.status,
                        html: true
                    }, function(){
                        if(resp.redirect){
                            window.location = resp.redirect;
                        }
                        if(resp.reload){
                            window.location = window.location.href;
                        }
                    });
                }
                else{
                    if(resp.redirect){
                        window.location = resp.redirect;
                    }
                    if(resp.reload){
                        window.location = window.location.href;
                    }
                }
            }, 'json');
        });


        //define helpers
        var helpers = {
            setCorrectClasses: function(form){
                var valid_elements = form.find('input[type=text], input[type=password], select, textarea').closest('.parent-tag').not('.invalid');
                valid_elements.addClass('valid');
            },
            clearErrors: function(form){
                form.find('.errors').remove();
                form.find('.invalid').removeClass('invalid');
                form.find('.valid').removeClass('valid');
            },
            appendErrors: function(form, errors){
                var first_element = null;
                for(var element_name in errors){
                    var el = form.find('[name="'+element_name+'"]'),
                        parent = opts.parent_selector ? el.closest(opts.parent_selector) : el.parent(),
                        error_container = parent.find('.errors'),
                        msg_key = Object.keys(errors[element_name])[0],
                        msg = errors[element_name][msg_key];
                    parent = parent.length?parent:el.parent();

                    if(first_element == null){
                        first_element = el;
                    }

                    if(error_container.length == 0){
                        error_container = $('<span />', {'class': 'errors'});
                        parent.append(error_container);
                    }

                    parent.addClass('invalid');
                    error_container.text(msg);
                }

                //scroll to invalid element
                var more_offset = 0;
                if(opts.scroll_top_offset_selector != null){
                    $(opts.scroll_top_offset_selector).each(function(){
                        more_offset += $(this).outerHeight();
                    });
                }
                if(opts.scroll_top_offset){
                    more_offset += opts.scroll_top_offset;
                }
                $('body,html').animate({scrollTop: first_element.offset().top - more_offset - 20}, function(){
                    first_element.focus();
                });
            }
        };
    };
})(typeof jQuery !== 'undefined' ? jQuery : $);
