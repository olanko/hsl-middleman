#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

var trams = {};

amqp.connect('amqp://localhost', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var ex = 'hsl_exchange';

    ch.assertExchange(ex, 'direct', {durable: false});

    ch.assertQueue('', {exclusive: true}, function (err, q) {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
        ch.bindQueue(q.queue, ex, 'vehicledata');

        ch.consume(q.queue, function(msg) {
            msg = JSON.parse(msg.content);

            trams[msg.VP.veh] = msg;

            //console.log(msg.VP.veh);

        }, {noAck: true});
      });
    });

    /* RPC to return latest tram positions */
    conn.createChannel(function(err, ch) {
        var q = 'hsl_positions';

        ch.assertQueue(q, {durable: false});
        console.log(' [hsl_positions] Awaiting RPC requests');
        ch.consume(q, function reply(msg) {
            ch.sendToQueue('hsl_request_channel', new Buffer({ 'channel': '*' }));

            ch.sendToQueue(msg.properties.replyTo,
                            new Buffer(JSON.stringify(trams)),
                            {correlationId: msg.properties.correlationId, contentType: "application/json"});

            ch.ack(msg);
        });
    });
});
