$.fn.simpleAjaxSubmit = function(){

    $.each(this, function(){

        $(this).on('submit', function(e){
            e.preventDefault();
            var form = $(this),
                button = form.find('[type=submit]'),
                data = form.serialize();

            button.attr('disabled', 'disabled');
            helpers.clearErrors(form);

            $.post(wp_vars.ajax_url, data, function(resp){
                //swap csrf key with fresh one
                if(resp.csrf){
                    form.find('[name="csrf"]').val(resp.csrf);
                }

                //if custom callback specified
                var callback = form.data('callback');
                if(callback){
                    if(!callback.apply(this, arguments)){
                        return;
                    }
                }

                button.removeAttr('disabled');

                //do status specific actions
                if(resp.status == 'invalid' && resp.data){
                    helpers.appendErrors(form, resp.data);
                    helpers.setCorrectClasses(form);
                }
                if(resp.status == 'error'){
                    if(!resp.alert_msg){
                        swal({
                            title: "",
                            text: 'Unknown error occurred',
                            type: 'error'
                        });
                    }
                }
                if(resp.status == 'success'){}

                //show message if passed
                if(resp.alert_msg){
                    swal({
                        title: "",
                        text: resp.alert_msg,
                        type: resp.status == 'invalid' ? 'warning' : resp.status
                    }, function(){
                        if(resp.redirect){
                            window.location = resp.redirect;
                        }
                    });
                }
                else{
                    if(resp.redirect){
                        window.location = resp.redirect;
                    }
                }
            }, 'json');
        });

    });

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
                var el = form.find('[name='+element_name+']'),
                    parent = el.closest('.parent-tag'),
                    error_container = parent.find('.errors'),
                    msg_key = Object.keys(errors[element_name])[0],
                    msg = errors[element_name][msg_key];

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

            first_element.focus();
        }
    };
};
