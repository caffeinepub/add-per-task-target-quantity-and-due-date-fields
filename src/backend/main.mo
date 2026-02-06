import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import Runtime "mo:core/Runtime";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Progress = {
    #belumMulai;
    #sedangDikerjakan;
    #selesai;
  };

  type Category = {
    #prioritas;
    #medium;
    #santai;
  };

  type ChecklistItem = {
    text : Text;
    checked : Bool;
  };

  type NoteContent = {
    text : Text;
    isBold : Bool;
    isItalic : Bool;
    isHeading : Bool;
    isBulletPoint : Bool;
    checklistItems : ?[ChecklistItem];
  };

  type Note = {
    id : Text;
    title : Text;
    content : [NoteContent];
    images : [Storage.ExternalBlob];
    timestamp : Time.Time;
    progress : Progress;
    category : Category;
    target : ?Nat;
    dueDate : ?Time.Time;
    owner : Principal;
  };

  public type UserProfile = {
    name : Text;
  };

  module ChecklistItem {
    public func compare(a : ChecklistItem, b : ChecklistItem) : Order.Order {
      Text.compare(a.text, b.text);
    };
  };

  let notes = Map.empty<Text, Note>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Note management with authorization
  public shared ({ caller }) func createNote(
    title : Text,
    content : [NoteContent],
    images : [Storage.ExternalBlob],
    progress : Progress,
    category : Category,
    target : ?Nat,
    dueDate : ?Time.Time,
  ) : async Text {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users or admins can create notes");
    };
    let id = title.concat(Time.now().toText());
    let note : Note = {
      id;
      title;
      content;
      images;
      timestamp = Time.now();
      progress;
      category;
      target;
      dueDate;
      owner = caller;
    };
    notes.add(id, note);
    id;
  };

  public shared ({ caller }) func updateNote(
    id : Text,
    title : Text,
    content : [NoteContent],
    images : [Storage.ExternalBlob],
    progress : Progress,
    category : Category,
    target : ?Nat,
    dueDate : ?Time.Time,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users or admins can update notes");
    };
    switch (notes.get(id)) {
      case (null) { Runtime.trap("Catatan tidak ditemukan") };
      case (?existingNote) {
        if (existingNote.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own notes");
        };
        let updatedNote : Note = {
          id;
          title;
          content;
          images;
          timestamp = Time.now();
          progress;
          category;
          target;
          dueDate;
          owner = existingNote.owner;
        };
        notes.add(id, updatedNote);
      };
    };
  };

  public shared ({ caller }) func deleteNote(id : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users or admins can delete notes");
    };
    switch (notes.get(id)) {
      case (null) { Runtime.trap("Catatan tidak ditemukan") };
      case (?note) {
        if (note.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete your own notes");
        };
        notes.remove(id);
      };
    };
  };

  public query ({ caller }) func getNote(id : Text) : async Note {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users or admins can view notes");
    };
    switch (notes.get(id)) {
      case (null) { Runtime.trap("Catatan tidak ditemukan") };
      case (?note) {
        if (note.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own notes");
        };
        note;
      };
    };
  };

  public query ({ caller }) func getAllNotes() : async [Note] {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users or admins can view notes");
    };
    if (AccessControl.isAdmin(accessControlState, caller)) {
      notes.values().toArray();
    } else {
      notes.values().filter(func(note) { note.owner == caller }).toArray();
    };
  };

  public shared ({ caller }) func checklistToggle(noteId : Text, itemText : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users or admins can toggle checklist items");
    };
    switch (notes.get(noteId)) {
      case (null) { Runtime.trap("Catatan tidak ditemukan") };
      case (?note) {
        if (note.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only modify your own notes");
        };
        let updatedContent = note.content.map(
          func(content) {
            switch (content.checklistItems) {
              case (null) { content };
              case (?items) {
                let updatedItems = items.map(
                  func(item) {
                    if (item.text == itemText) {
                      { item with checked = not item.checked };
                    } else {
                      item;
                    };
                  }
                );
                { content with checklistItems = ?updatedItems };
              };
            };
          }
        );
        let updatedNote : Note = {
          note with content = updatedContent;
        };
        notes.add(noteId, updatedNote);
      };
    };
  };

  public shared ({ caller }) func addImageToNote(noteId : Text, image : Storage.ExternalBlob) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users or admins can add images to notes");
    };
    switch (notes.get(noteId)) {
      case (null) { Runtime.trap("Catatan tidak ditemukan") };
      case (?note) {
        if (note.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only modify your own notes");
        };
        let newImages = Array.tabulate(
          note.images.size() + 1,
          func(i) {
            if (i < note.images.size()) {
              note.images[i];
            } else {
              image;
            };
          },
        );
        let updatedNote : Note = {
          note with images = newImages;
        };
        notes.add(noteId, updatedNote);
      };
    };
  };

  public shared ({ caller }) func filterNotesByCategory(category : Category) : async [Note] {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users or admins can filter notes");
    };
    let filteredList = List.empty<Note>();
    for (note in notes.values()) {
      if ((note.owner == caller or AccessControl.isAdmin(accessControlState, caller)) and note.category == category) {
        filteredList.add(note);
      };
    };
    filteredList.toArray();
  };

  public shared ({ caller }) func filterNotesByProgress(progress : Progress) : async [Note] {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users or admins can filter notes");
    };
    let filteredList = List.empty<Note>();
    for (note in notes.values()) {
      if ((note.owner == caller or AccessControl.isAdmin(accessControlState, caller)) and note.progress == progress) {
        filteredList.add(note);
      };
    };
    filteredList.toArray();
  };
};
