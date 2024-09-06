class UndoRedoManager
{
    constructor(limit, undoCb, redoCb)
    {
        this.limit = limit;
        this.stkUndo = [];
        this.stkRedo = [];
        this.globalUndoCb = undoCb;
        this.globalRedoCb = redoCb;

        this.mapCallbacks = new Map();
        this.AddBtnListener();
    }

    AddBtnListener()
    {
        document.addEventListener('keydown', function(event) {
            
            if (event.ctrlKey) 
            {
                //'Z'
                if (event.key === 'z' || event.key === 'Z') 
                {
                    this.OnUndo(event);
                }
                //'Y'
                if (event.key === 'y' || event.key === 'Y') 
                {
                    this.OnRedo(event);
                }
            }
        });
    }

    uuidv4() 
    {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c)
        {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    UpdateStackLimit(limit)
    {
        this.limit = limit;
    }    

    HasUndo()
    {
        return this.stkUndo.length > 0;
    }

    HasRedo()
    {
        return this.stkRedo.length > 0;
    }

    ClearUndoRedoStack()
    {
        this.stkUndo = [];
        this.stkRedo = [];
        this.mapCallbacks.clear();
    }

    /**
     * 
     * @param {object} undoCommand 
     */
    AddCommandToUndoStack(undoCommand)
    {
        //undoCommand expected format
        // {
        //     value : //any
        //     preventDefault: boolean //default is false
        //     undoFn: //function or null (if null fallback undo callback is called)
        //     redoFn: //function or null (if null fallback undo callback is called)
        //     context: //context on which function are to be called
        // }

        //we store callbacks in Map to avoid duplication and unique id is generated for mapping

        let value = undoCommand.value;
        let preventDefault = undoCommand.preventDefault ? undoCommand.preventDefault : false; 
        let undoCb = undoCommand.undoCb;
        let redoCb = undoCommand.redoCb;
        let context = undoCommand.context;
        
        let commandId = this.uuidv4();

        this.stkUndo.push({
            id: commandId,
            value: value
        });

        this.mapCallbacks.set(commandId, {undoCb, redoCb, context, preventDefault});

        if(this.stkUndo.length > this.limit)
            this.RemoveOldestCommand();
    }

    /**
     * remove the first command
     */
    RemoveOldestCommand()
    {
        let command = this.stkUndo[0];
        if(!command)
            return;
        
        let commandId = command.id;
        this.mapCallbacks.delete(commandId);
        this.stkUndo.shift();
    }

    OnUndo(event)
    {
        let undoCommand = this.stkUndo.pop();
        if(!undoCommand)
            return;

        let {id, value} = undoCommand;

        let {undoCb, _, context} = this.mapCallbacks.get(id);
        context = context ? context : window;
        
        if(preventDefault)
            event.preventDefault();
        
        if(undoCb)
        {
            undoCb.call(context, value);
        }
        
        if(this.globalUndoCb)
        {
            this.globalUndoCb.call(context, value);
        }

        AddCommandToRedoStack(undoCommand);    
    }

    /**
     * 
     * @param {object} redoCommand 
     */
    AddCommandToRedoStack(redoCommand)
    {
        this.stkRedo.push(redoCommand);
    }

    OnRedo(event)
    {
        let redoCommand = this.stkUndo.pop();
        if(!redoCommand)
            return;

        let {id, } = redoCommand;

        let {_, redoCb, context, preventDefault} = this.mapCallbacks.get(id);
        context = context ? context : window; 

        if(preventDefault)
            event.preventDefault();

        if(redoCb)
        {
            redoCb.call(context, redoCommand);
        }
        
        if(this.globalRedoCb)
        {
            this.globalRedoCb.call(context, redoCommand);
        }

        this.AddCommandToUndoStack(redoCommand);
    }
}

module.exports = UndoRedoManager;