#!/usr/bin/env node
var _ = require('lodash');
var amqp = require('amqplib/callback_api');

var trams = {};

var cleanup = function () {
//    console.log('cleanup');
    if (!_.size(trams)) {
        return;
    }

    _.forEach(trams, function (tram, key) {
        if (tram.lastseen < Date.now() - 5 * 60 * 1000) {
            delete trams[key];
        }
    });
};
setInterval(cleanup, 60 * 1000);

amqp.connect('amqp://localhost', function(err, conn) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  conn.createChannel(function(err, ch) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    
    ch.assertQueue('', {exclusive: true}, function (err, q) {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
        ch.bindQueue(q.queue, 'hsl_exchange', 'vehicledata');

        ch.consume(q.queue, function(msg) {
            msg = JSON.parse(msg.content);

            trams[msg.VP.veh] = msg;
            trams[msg.VP.veh].lastseen = Date.now();

            //console.log(msg.VP.veh);

        }, {noAck: true});
      });
    });

    /* RPC to return latest tram positions */
    conn.createChannel(function(err, ch) {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        var q = 'hsl_positions';

        ch.assertQueue(q, {durable: false});
        console.log(' [hsl_positions] Awaiting RPC requests');
        ch.consume(q, function reply(msg) {
            ch.sendToQueue('hsl_request_channel',
                    new Buffer(JSON.stringify({ 'channel': '*' })),
                    {noAck: true}
                );

            ch.sendToQueue(msg.properties.replyTo,
                    new Buffer(JSON.stringify(trams)),
                    {
                        correlationId: msg.properties.correlationId,
                        contentType: "application/json"
                    });

            ch.ack(msg);
        });
    });
});
