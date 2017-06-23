(function($){
	$.fn.placeholder = function(){
		var searchText = this;
		var searchValue = searchText.attr('placeholder');
		if ( !( 'placeholder' in document.createElement('input') ) ){
			searchText.removeAttr('placeholder').val(searchValue).bind('focus',function(){
				if ( this.value==searchValue) {this.value=''; };
			}).bind('blur',function(){
				if ( this.value=='' ){ this.value=searchValue; };
			});
		}else{
			searchText.bind('focus',function(){
				if ( jQuery(this).attr('placeholder') == searchValue ){ jQuery(this).attr('placeholder','') };
			}).bind('blur',function(){
				if ( jQuery(this).attr('placeholder','') ){ jQuery(this).attr('placeholder',searchValue) };
			});
		}
	}
})(jQuery);
