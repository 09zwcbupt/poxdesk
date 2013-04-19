/*
#asset(qx/icon/Tango/16/categories/internet.png)
*/

qx.Class.define("poxdesk.TopoViewer",
{
  extend : qx.core.Object,
  
  events :
  {
  },
  
  properties :
  {    

  },
  
  construct : function()
  {
    this._switches = {};
    this._container = new poxdesk.ui.window.Window("TopoViewer");
    this._container.addListener("close", this.dispose, this);
    this._container.set({
      icon: "icon/16/categories/internet.png",
      width: 400,
      height: 400,
      contentPadding : [ 0, 0, 0, 0 ],
      allowMaximize : true,
      showMaximize : true
    });
    this._container.setLayout(new qx.ui.layout.VBox());
   
    this._canvas = new qx.ui.embed.Canvas().set({
      syncDimension: true
    });

    //alert(this._canvas.getContentElement());//Context2d());

    this._container.add(this._canvas, {flex: 1});







this.graph = new Graph();
var graph = this.graph;

var springy;

this._canvas.addListenerOnce('appear', function(){//this part is the init of topoviewer. alert("good1");
var canvas = this._canvas.getContentElement().getDomElement();
jQuery(function(){
	springy = jQuery(canvas).springy({
		graph: graph
	});
});
  }, this);

this._canvas.addListener('redraw', function () {
  this.graph.notify();
}, this);





    this._messenger = new poxdesk.Messenger();
    this._messenger.start();
    this._messenger.addListener("connected", function (e) {
      var data = e.getData();
	  this.debug("data: " + data);
	  this.debug("CONNECTED session " + data.getSession());
      var chan = "poxdesk_topo";
      this._messenger.join(chan);
      this._messenger.addChannelListener(chan, this._on_topo, this);
      this.refresh();
    }, this);



this._nodes = {};
this._edges = {};
this._hosts = {};
this._host_edges = {};

  },
  
 
  members :
  {

    refresh : function ()
    {
      this._messenger.send({'cmd':'refresh'}, 'poxdesk_topo');
    },

    _on_topo : function (data)//receive json data from POX[messenger]
    {
      if (data.topo)
      {
        var ne = data.topo.links;//get link information
        var nn = data.topo.switches;//get switches information
        var nh = data.topo.hosts;//get host information
		var he = data.topo.host_edges;//get edges that connect host & edge

		//all we should do is working on the third concept: host
		//and also, we have to modify links, adding information
		//of what is connected by this link
        var all_node_names = qx.lang.Object.clone(nn);//what's this doing?->copy switch info
        qx.lang.Object.mergeWith(all_node_names, this._nodes);//function of mergeWith?

        this.warn("SW: " + JSON.stringify(all_node_names));//used to be a comment(should be printing node name info)
        

        for (var node_name in all_node_names)//all node name, current name maintained by poxdesk combine with another by pox
        {
          var old_node = this._nodes[node_name];
          var new_node = nn[node_name];

          //compare to see if it exists before
          if (old_node !== undefined && new_node !== undefined)
          {
            // We're good.
          }
          else if (old_node === undefined)
          {
            // New node
            this.debug(new_node);//?
            var n = this.graph.newNode({label:new_node.label || node_name});//draw a new node
            this._nodes[node_name] = n;//add content into node list(not undefined anymore)
          }
          else
          {
            // Remove node...
            this.graph.removeNode(old_node);
            delete this._nodes[node_name];
          }
        }



        var all_host_names = qx.lang.Object.clone(nh);//what's this doing?->copy switch info
        qx.lang.Object.mergeWith(all_host_names, this._hosts);//function of mergeWith?

		for (var host_name in all_host_names)//all node name, current name maintained by poxdesk combine with another by pox
        {
          var old_host = this._hosts[host_name];
          var new_host = nh[host_name];

		  //compare to see if it exists before
          if (old_host !== undefined && new_host !== undefined)
          {
            // We're good.
          }
          else if (old_host === undefined)
          {
            // New node
            this.debug(new_host);//?
            var n = this.graph.newNode({label:new_host.label || host_name});//draw a new node
            this._hosts[host_name] = n;//add content into node list(not undefined anymore)
          }
          else
          {
            // Remove node...
            this.graph.removeNode(old_host);
            delete this._hosts[host_name];
          }
        }



        var dead_edge_names = qx.lang.Object.clone(this._edges);
        for (var i = 0; i < ne.length; i++)
        {
          var a = ne[i][0];
          var b = ne[i][1];
		  //this.debug("printing edges" + a + "," + b );//convert JSON into string and print
          if (a > b) { var x = a; a = b; b = x; } // Swap
          var en = a + " " + b;
          if (this._edges[en] === undefined)
          {
            // New edge
            var aa = this._nodes[a];
            var bb = this._nodes[b];
            if (!aa || !bb) continue;

            var e = this.graph.newEdge(aa,bb, {directional:false});
            this._edges[en] = e;
          }
          else
          {
            delete dead_edge_names[en];
          }
        }

        for (var edge_name in dead_edge_names)
        {
          var dead = dead_edge_names[edge_name];
          this.graph.removeEdge(dead);
          delete this._edges[edge_name];
        }

		var host_edges_names = qx.lang.Object.clone(this._host_edges);
		for (var i = 0; i < he.length; i++)
        {
          var a = he[i][0];
          var b = he[i][1];
          var en = a + " " + b;
          //this.debug("standard: " + this._host_edges[en]=== undefined);
		  if (this._host_edges[en] == undefined)
          {
            // New edge
            var aa = this._nodes[a];
            var bb = this._hosts[b];
            if (!aa || !bb) continue;

            var e = this.graph.newEdge(aa,bb, {directional:false, color: '#EB6841'});
            this._host_edges[en] = e;
          }
          else
          {
            delete host_edges_names[en];
          }
        }

        for (var edge_name in host_edges_names)
        {
          var dead_edge = host_edges_names[edge_name];
		  //this.debug("delete: " + edge_name + dead_edge);
          this.graph.removeEdge(dead_edge);
          delete this._host_edges[edge_name];
        }
		/*
		for (var edge_name in host_edges_names)
		{
			this.debug("to delete: " + edge_name);
		}
		for (var edge_name in this._host_edges)
		{
			this.debug("this record: " + edge_name);
		}*/

      }
    },



    _switches : null, // switches we know about
    _messenger : null,
    _container : null
    //_controls : null,
    //_timer : null
  },

  destruct : function() {
    this._disposeObjects("_messenger");
  }
});
