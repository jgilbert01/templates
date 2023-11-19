module.exports.events = JSON.stringify({
  "widgets": [
    {
      "height": 6,
      "width": 12,
      "y": 0,
      "x": 0,
      "type": "metric",
      "properties": {
        "metrics": [
          [{ "expression": "SEARCH(' MetricName=\"domain.event.count\" ', 'Sum', 300)", "label": "Events: ${SUM} : ${LABEL}", "id": "events" }]
        ],
        "view": "pie",
        "stacked": false,
        "region": "${opt:region}",
        "start": "-P1D",
        "end": "P0D",
        "stat": "Sum",
        "period": 300,
        "setPeriodToTimeRange": true,
        "yAxis": {
          "left": {
            "label": "",
            "showUnits": false
          },
          "right": {
            "label": "",
            "showUnits": false
          }
        },
        "legend": {
          "position": "right"
        },
        "title": "Event Type Counts"
      }
    },
    {
      "height": 6,
      "width": 12,
      "y": 0,
      "x": 12,
      "type": "metric",
      "properties": {
        "metrics": [
          [{ "expression": "SEARCH(' MetricName=\"domain.event.size\" ', 'Maximum', 300)", "label": "Events: ${MAX} : ${LABEL}", "id": "events" }]
        ],
        "view": "pie",
        "stacked": false,
        "region": "${opt:region}",
        "start": "-P1D",
        "end": "P0D",
        "stat": "Maximum",
        "period": 300,
        "setPeriodToTimeRange": true,
        "yAxis": {
          "left": {
            "label": "",
            "showUnits": false
          },
          "right": {
            "label": "",
            "showUnits": false
          }
        },
        "legend": {
          "position": "right"
        },
        "title": "Event Type Sizes"
      }
    },
    {
      "height": 6,
      "width": 24,
      "y": 6,
      "x": 0,
      "type": "metric",
      "properties": {
        "metrics": [
          [{ "expression": "SEARCH(' MetricName=\"domain.event.count\" ', 'Sum', 300)", "label": "Events: ${SUM} : ${LABEL}", "id": "events" }]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "${opt:region}",
        "start": "-P1D",
        "end": "P0D",
        "stat": "Sum",
        "period": 300,
        "setPeriodToTimeRange": true,
        "yAxis": {
          "left": {
            "label": "",
            "showUnits": false
          },
          "right": {
            "label": "",
            "showUnits": false
          }
        },
        "legend": {
          "position": "right"
        },
        "title": "Event Type Counts"
      }
    },
    {
      "height": 6,
      "width": 24,
      "y": 12,
      "x": 0,
      "type": "metric",
      "properties": {
        "metrics": [
          [{ "expression": "SEARCH('{AWS/Lambda,FunctionName} MetricName=\"IteratorAge\" FunctionName=template OR edw OR edw', 'Maximum', 300)", "label": "${MAX} : ${LABEL}", "id": "iterators" }]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "${opt:region}",
        "stat": "Maximum",
        "period": 300,
        "legend": {
          "position": "right"
        },
        "setPeriodToTimeRange": true,
        "yAxis": {
          "left": {
            "label": "ms",
            "showUnits": false
          },
          "right": {
            "showUnits": false
          }
        },
        "annotations": {
          "horizontal": [
            {
              "label": "15 minutes",
              "value": 900000,
              "fill": "above"
            },
            [
              {
                "label": "5 minutes",
                "value": 300000
              },
              {
                "value": 900000,
                "label": "15 minutes"
              }
            ]
          ]
        },
        "title": "Iterator Age"
      }
    },
    {
      "height": 6,
      "width": 24,
      "y": 18,
      "x": 0,
      "type": "metric",
      "properties": {
        "metrics": [
          [{ "expression": "SEARCH(' MetricName=\"domain.event.size\" ', 'Maximum', 300)", "label": "Events: ${MAX} : ${LABEL}", "id": "events" }]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "${opt:region}",
        "start": "-P1D",
        "end": "P0D",
        "stat": "Maximum",
        "period": 300,
        "setPeriodToTimeRange": true,
        "yAxis": {
          "left": {
            "label": "",
            "showUnits": false
          },
          "right": {
            "label": "",
            "showUnits": false
          }
        },
        "legend": {
          "position": "right"
        },
        "annotations": {
          "horizontal": [
            {
              "label": "256k",
              "value": 262144,
              "fill": "above"
            }
          ]
        },
        "title": "Event Type Sizes"
      }
    }
  ]
});

