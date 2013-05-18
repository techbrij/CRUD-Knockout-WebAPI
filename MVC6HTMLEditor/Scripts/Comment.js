//URL

var commentApiUrl = '/api/comment';


// Model
function Comment(data) {
    var self = this;
    data = data || {};

    // Persisted properties
    self.CommentID = data.CommentID;
    self.Name = ko.observable(data.Name || "");
    self.Email = ko.observable(data.Email || "");
    self.HTMLComment = ko.observable(data.HTMLComment || "");
    self.error = ko.observable();
    //persist edits to real values on accept
    self.acceptChanges = function () {
        self.HTMLComment($('.htmlEditor').htmlarea('toHtmlString'));
        dataContext.saveComment(self);
        window.commentViewModel.selectedComment(null);
    };

    //reset to originals on cancel
    self.cancelChanges = function () {
        window.commentViewModel.selectedComment(null);
    };

    self.deleteComment = function () {
        if (confirm('Do you really want to delete this comment?')) {
            dataContext.deleteComment(self).done(function () {
                window.commentViewModel.comments.remove(self);
            });            
        }
    }

}


// DataContext 
var dataContext = {
    saveComment: function (comment) {
        var InsertMode = comment.CommentID ? false : true;
        comment.error(null);

        if (InsertMode) {
            var options = {
                dataType: "json",
                contentType: "application/json",
                cache: false,
                type:  'POST',
                data: ko.toJSON(comment)
            };
            return $.ajax(commentApiUrl, options)
                 .done(function (result) {
                     comment.CommentID = result.CommentID;                    
                     window.commentViewModel.comments.push(comment);                     
                 })
                 .fail(function () {
                    alert('Error on adding comment');
                 });

        }
        else {
            var options = {
                dataType: "json",
                contentType: "application/json",
                cache: false,
                type: 'PUT',
                data: ko.toJSON(comment)
            };
            return $.ajax(commentApiUrl+"/" + comment.CommentID, options)                 
                 .fail(function () {
                     comment.error('Error on adding comment');
                 });
        }
    },

    getComments: function (commentObservable, errorObservable) {
        var options = {
            dataType: "json",
            contentType: "application/json",
            cache: false,
            type: 'GET'
        };

        return $.ajax(commentApiUrl, options)
             .done(getSucceeded)
             .fail(getFailed);

        function getSucceeded(data) {
            var mappedComments = $.map(data, function (list) { return new Comment(list); });
            commentObservable(mappedComments);
        }

        function getFailed() {
            errorObservable("Error retrieving comments.");
        }
    },

    deleteComment: function (comment) {
        var options = {
            dataType: "json",
            contentType: "application/json",
            cache: false,
            type: 'DELETE'           
        };
        return $.ajax(commentApiUrl + "/" + comment.CommentID, options)
             .fail(function () {
                 comment.error('Error on adding comment');
             });

    }
}



//Custom Knockout Binding

//custom binding to initialize a jQuery UI dialog
ko.bindingHandlers.jqDialog = {
    init: function (element, valueAccessor) {
        var options = ko.utils.unwrapObservable(valueAccessor()) || {};

        //handle disposal
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            $(element).dialog("destroy");
        });

        $(element).dialog(options);
    }
};

//custom binding handler that opens/closes the dialog
ko.bindingHandlers.openDialog = {
    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value) {
            $(element).dialog("open");
        } else {
            $(element).dialog("close");
        }
    }
}

//ViewModel
window.commentViewModel = (function () {
    var comments = ko.observableArray(),
    error = ko.observable(),
    addComment = function () {
        selectedComment(new Comment());
        loadEditor();
    },
    selectedComment = ko.observable(''),
    editComment = function (comment) {
        selectedComment(comment);
        loadEditor();
    };
    dataContext.getComments(comments, error);

    function loadEditor() {

        $(".htmlEditor").htmlarea({          
            // Override/Specify the Toolbar buttons to show
            toolbar: [
                ["bold", "italic", "h1", "link", //"image", 
                 "orderedList", "unorderedList", "horizontalrule", {
                     // This is how to add a completely custom Toolbar Button
                     css: "justifyleft",
                     text: "Code Sample <pre><code>",
                     action: function (btn) {
                         // 'this' = jHtmlArea object                         
                         this.pasteHTML('<pre><code>' + this.getSelectedHTML() + '</code></pre>');
                     }
                 }]
            ],
            toolbarText: $.extend({}, jHtmlArea.defaultOptions.toolbarText, {
                h1: "Heading 1", horizontalrule: "Insert Horizontal Rule"
            })
        });
    }
    return {
        comments: comments,
        error: error,
        addComment: addComment,
        selectedComment: selectedComment,
        editComment: editComment
    }
})();



// Initiate the Knockout bindings
ko.applyBindings(window.commentViewModel);
