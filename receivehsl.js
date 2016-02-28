#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

amqp.connect('amqp://192.168.0.2', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var ex = 'hsl_exchange';

    var trams = {};

    ch.assertExchange(ex, 'fanout', {durable: false});

    ch.assertQueue('', {exclusive: true}, function (err, q) {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
        ch.bindQueue(q.queue, ex, '');

        ch.consume(q.queue, function(msg) {
            msg = JSON.parse(msg.content);

            trams[msg.VP.veh] = msg;

            console.log(trams['RHKL00229']);

        }, {noAck: true});
      });
    });
});