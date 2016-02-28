#!/usr/bin/env node
var amqp = require('amqplib/callback_api');

amqp.connect('amqp://192.168.0.2', function(err, conn) {
    if (err) {
        console.error(err);
        process.exit(1);
    } else {
        console.log('conn ok');

        conn.createChannel(function(err, ch) {
            var q = 'hello';
            var n = 10000;
            var start_time = Date.now();
            var end_time;
            console.log(start_time);

            function send_message () {
                var m = ' ' + n;// + ' ' + new Date().toISOString();

                ch.assertQueue(q, {durable: true});
                ch.sendToQueue(q, new Buffer(m), {persistent: true});
                //console.log(" [x] Sent '" + m + "'");

                if (n < 0) {
                    end_time = Date.now();
                    console.log('sent messages in ' + (end_time - start_time) + ' ms');

/*                    conn.close();
                    process.exit(0);*/
                } else {
                    n += -1;
                    //send_message();
                    setTimeout(send_message, 5);
                }
            }
            send_message();
        });
    }
});