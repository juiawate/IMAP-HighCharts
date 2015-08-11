var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('index', {});
});

router.post('/', function(req, res) {
    //console.log('req body: ',req.body);

    var Imap = require('imap');

    var imap = new Imap({
        user: req.body.email,
        password: req.body.pwd,
        host: 'imap.mail.yahoo.com',
        port: 993,
        tls: true
    });

    function openInbox(cb) {
        imap.openBox('INBOX', true, cb);
    }

    imap.once('ready', function() {
        var allMessages = [];
        var buf, attr;
        openInbox(function(err, box) {
            if (err) throw err;
            imap.search(['ALL'], function (err, results) {
                if (err) throw err;
                var f = imap.seq.fetch(results, { bodies: '', struct: true });
                f.on('message', function (msg, seqno) {
                    msg.on('body', function (stream, info) {
                        var buffer = '';
                        stream.on('data', function (chunk) {
                            buffer += chunk.toString('utf8');
                        });

                        stream.once('end', function () {
                            buf = Imap.parseHeader(buffer);
                        });
                    });
                    msg.once('attributes', function (attrs) {
                        attr = attrs;
                    });
                    msg.once('end', function () {
                        allMessages.push({
                            id: seqno,
                            buffer: buf,
                            attr: attr
                        });
                    });
                });
                f.once('error', function (err) {
                    console.log('Fetch error: ' + err);
                });
                f.once('end', function () {
                    console.log('all:: ',allMessages);
                    console.log('Done fetching all messages!');
                    imap.end();
                    res.status(200).json(allMessages);
                });
            });
        });
    });

    imap.once('error', function(err) {
        console.log(err);
    });

    imap.once('end', function() {
        console.log('Connection ended');
    });

    imap.connect();


});



module.exports = router;