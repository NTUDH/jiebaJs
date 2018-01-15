
define(["finalseg/prob_emit", "finalseg/prob_start", "finalseg/prob_trans"], function (prob_emit, prob_start, prob_trans) {
    var re_han = /([\u4E00-\u9FA5a-zA-Z0-9+#&\._]+)/,
        re_skip = /(\r\n|\s)/;
    var PrevStatus = {
        'B': ['E','S'],
        'M': ['M','B'],
        'S': ['S','E'],
        'E': ['B','M']
    };

    function viterbi(obs, states, start_p, trans_p, emit_p){
        var V = [{}];
        var path = {};
        var prob = -9999999999.9, state = "S";
        for(var i_y in states){
            var y = states[i_y];
            var this_val = emit_p[y][obs[0]];
            var em_p = (this_val === undefined || this_val === null) ? -9999999999.9 : this_val;
            V[0][y] = start_p[y] + em_p;
            path[y] = [y];
        }
        var newpath = {};
        for(var t=1; t<obs.length; t++){
            V.push({});
            for(var i_y in states){
                var y=states[i_y];
                var this_val = emit_p[y][obs[t]];
                var em_p = (this_val === undefined || this_val === null) ? -9999999999.9 : this_val;
                for(var i_y0 in PrevStatus){
                    var y0 = PrevStatus[i_y0];
                    this_val = trans_p[y];
                    var t_p = (this_val === undefined || this_val === null) ? -9999999999.9 : this_val;
                    if(V[t-1][y0] + t_p + em_p > prob){
                        prob = V[t-1][y0] + t_p + em_p;
                        state = y0;
                    }
                }
                V[t][y] =prob;
                var dp_path = (path[state] === undefined || path[state] === null) ? [] : path[state];
                var tmp_path = dp_path.concat(); tmp_path.push(y);
                newpath[y] = tmp_path.concat();
            }
            path = newpath;
        }
        var tmp_targ = ['E','S'];
        for(var y_i in tmp_targ){
            var y = tmp_targ[i_y];
            if(V[obs.length - 1][y] > prob){
                prob = V[obs.length - 1][y];
                state = y;
            }
        }
        //console.log(V); //debug
        //console.log(path); //debug
               
        //console.log("prob: "+prob); //debug
        //console.log("state: "+state); //debug
        //console.log("path of state: "+path[state]); //debug
        return {
            'prob': prob,
            'path': path[state]
        };
    }

    function __cut(sentence) {
        // console.log("cut sentence: " + sentence); //debug
        var SP = prob_start.start_P;
        var EP = prob_emit.emit_P;
        var TP = prob_trans.trans_P;
        var v = viterbi(sentence, ('B', 'M', 'E', 'S'), SP, TP, EP);
        var prob = v['prob'];
        var pos_list = v['path'];
        var outputv = [];
        var begin = 0, next = 0;
        for(var i in sentence){
            var pos = pos_list[i];
            if(pos=='B'){
                begin = i;
            }
            else if (pos=='E'){
                for(var t=begin; t<i+1; t++)
                    outputv.push(sentence[t]);
                next = i+1;
            }
            else if(pos=='S'){
                outputv.push(sentence[i]);
                next = i+1;
            }
        }
        if (next < sentence.length) {
            for (var t = next; t < sentence.length; t++)
                outputv.push(sentence[t]);
        }

        return outputv;
    }
    
    return {
        cut: function(sentence) {
            var yieldValues = [];
            var blocks = sentence.split(re_han);
            for (blk in blocks) {
                if (blocks[blk] == undefined || blocks[blk] == null) continue;

                if (blocks[blk].match(re_han)) {
                    var output = __cut(blocks[blk]);
                    for (word in output) {
                        yieldValues.push(output[word]);
                    }
                }
                else {
                    var tmp = blocks[blk].split(re_skip);
                    for (x in tmp) {
                        if (tmp[x] != "") {
                            yieldValues.push(tmp[x]);
                        }
                    }
                }
            }
            return yieldValues;
        }
    };
});
